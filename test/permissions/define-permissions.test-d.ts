import { describe, expectTypeOf, it } from 'vitest';
import { definePermissions } from '../../src/permissions';
import { defineResources } from '../../src/resources';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };
type Ctx = { featureFlag: boolean };

const resources = defineResources({
  project: {
    actions: ['read', 'update', 'delete'],
    resource: {} as Project,
  },
  invoice: {
    actions: ['read', 'approve'],
    resource: {} as Invoice,
  },
});

describe('definePermissions type safety', () => {
  it('accepts valid actions, wildcard and conditional permissions', () => {
    definePermissions<User, Ctx>()(resources, {
      '*': {
        viewer: { project: ['read'] },
        editor: {
          extends: ['viewer'],
          project: [
            'update',
            '*',
            {
              action: 'delete',
              when: ({ subject, resource }) => resource.ownerId === subject.id,
            },
          ],
        },
      },
      'org:acme': {
        manager: {
          invoice: [
            {
              action: 'approve',
              when: async ({ subject, resource }) =>
                resource.amount <= subject.approvalLimit,
            },
          ],
        },
      },
    });
  });

  it('types subject, resource and context inside when', () => {
    definePermissions<User, Ctx>()(resources, {
      '*': {
        editor: {
          invoice: [
            {
              action: 'approve',
              when: ({ subject, resource, context, scope }) => {
                expectTypeOf(subject).toEqualTypeOf<User>();
                expectTypeOf(resource).toEqualTypeOf<Invoice>();
                expectTypeOf(context).toEqualTypeOf<Ctx>();
                expectTypeOf(scope).toEqualTypeOf<string>();
                return true;
              },
            },
          ],
        },
      },
    });
  });

  it('rejects unknown actions in string form', () => {
    definePermissions<User>()(resources, {
      '*': {
        editor: {
          // @ts-expect-error "approve" is not a valid project action
          project: ['approve'],
        },
      },
    });
  });

  it('rejects unknown actions in object form', () => {
    definePermissions<User>()(resources, {
      '*': {
        editor: {
          // @ts-expect-error "publish" is not a valid project action
          project: [{ action: 'publish' }],
        },
      },
    });
  });

  it('rejects unknown resources', () => {
    definePermissions<User>()(resources, {
      '*': {
        editor: {
          // @ts-expect-error "document" is not a declared resource
          document: ['read'],
        },
      },
    });
  });
});
