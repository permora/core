import { describe, expectTypeOf, it } from 'vitest';
import { createAuthorization } from '../../src/authorization';
import { definePermissions } from '../../src/permissions';
import { defineResource, defineResources } from '../../src/resources';
import type { ResourceName } from '../../src/resources';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };
type Ctx = { featureFlag: boolean };

export const ResourceNames = {
  Project: 'project',
  Invoice: 'invoice',
} as const;

const resourcesFromConstNames = defineResources({
  [ResourceNames.Project]: defineResource<Project>().actions([
    'read',
    'update',
    'delete',
  ]),
  [ResourceNames.Invoice]: defineResource<Invoice>().actions([
    'read',
    'approve',
  ]),
});

enum ResourceNameEnum {
  Project = 'project',
  Invoice = 'invoice',
}

const resourcesFromEnum = defineResources({
  [ResourceNameEnum.Project]: defineResource<Project>().actions([
    'read',
    'update',
    'delete',
  ]),
  [ResourceNameEnum.Invoice]: defineResource<Invoice>().actions([
    'read',
    'approve',
  ]),
});

describe('strongly typed resource names', () => {
  it('infers names from as const map keys', () => {
    expectTypeOf<ResourceName<typeof resourcesFromConstNames>>().toEqualTypeOf<
      'project' | 'invoice'
    >();
  });

  it('infers names from string enum keys', () => {
    expectTypeOf<ResourceName<typeof resourcesFromEnum>>().toEqualTypeOf<
      'project' | 'invoice'
    >();
  });

  it('accepts ResourceNames constants in session.can', async () => {
    const permissions = definePermissions({
      resources: resourcesFromConstNames,
    })
      .forSubject<User>()
      .from({
        viewer: { project: ['read'] },
      });
    const authz = createAuthorization({
      resources: resourcesFromConstNames,
      permissions,
    });
    const session = authz.session({
      subject: { id: 'u1', approvalLimit: 100 },
      roles: ['viewer'],
    });

    await session.can(ResourceNames.Project, 'read');
    await session.can(ResourceNames.Invoice, 'read');
  });
});

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

describe('definePermissions type safety', () => {
  it('accepts valid actions, wildcard and conditional permissions', () => {
    definePermissions({ resources })
      .forSubject<User, Ctx>()
      .from({
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
      });
  });

  it('types subject, resource and context inside when', () => {
    definePermissions({ resources })
      .forSubject<User, Ctx>()
      .from({
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
      });
  });

  it('rejects unknown actions in string form', () => {
    definePermissions({ resources })
      .forSubject<User>()
      .from({
        editor: {
          // @ts-expect-error "approve" is not a valid project action
          project: ['approve'],
        },
      });
  });

  it('rejects unknown actions in object form', () => {
    definePermissions({ resources })
      .forSubject<User>()
      .from({
        editor: {
          // @ts-expect-error "publish" is not a valid project action
          project: [{ action: 'publish' }],
        },
      });
  });

  it('rejects unknown resources', () => {
    definePermissions({ resources })
      .forSubject<User>()
      .from({
        editor: {
          // @ts-expect-error "document" is not a declared resource
          document: ['read'],
        },
      });
  });
});
