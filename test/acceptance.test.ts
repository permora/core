/**
 * End-to-end acceptance test reproducing the SPEC §41 scenario through
 * the public API only.
 */
import { describe, expect, it } from 'vitest';
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../src/index';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: defineResource<Project>({
    actions: ['read', 'update', 'delete'],
  }),
  invoice: defineResource<Invoice>({
    actions: ['read', 'approve'],
  }),
});

import { scopedPermissions } from '../src/scoped';

const permissionBuilder = definePermissions<User, Record<string, never>>();
const permissions = permissionBuilder(
  resources,
  {
    '*': {
      viewer: {
        project: ['read'],
      },
      editor: {
        extends: ['viewer'],
        project: [
          'update',
          {
            action: 'delete',
            when: ({ subject, resource }) => resource.ownerId === subject.id,
          },
        ],
      },
    },
    'org:acme': {
      editor: {
        extends: ['viewer'],
        project: ['read', 'update', 'delete'],
      },
      manager: {
        extends: ['editor'],
        invoice: [
          'read',
          {
            action: 'approve',
            when: ({ subject, resource }) =>
              resource.amount <= subject.approvalLimit,
          },
        ],
      },
    },
  },
  { resolver: scopedPermissions() },
);

const authz = createAuthorization({ resources, permissions });

describe('SPEC §41 acceptance', () => {
  const session = authz.session({
    subject: { id: 'user_123', approvalLimit: 10_000 },
    scope: 'org:acme',
    roles: ['manager'],
    context: {},
  });

  const project: Project = { id: 'p1', ownerId: 'user_123' };
  const invoice: Invoice = { id: 'i1', amount: 5_000 };

  it('allows project read through transitive inheritance and scope fallback', async () => {
    // manager → org:acme.editor → *.viewer
    await expect(session.can('project', 'read')).resolves.toBe(true);
  });

  it('allows project delete through the org:acme editor override', async () => {
    await expect(session.can('project', 'delete', project)).resolves.toBe(true);
  });

  it('asserts invoice approval within the approval limit', async () => {
    await expect(
      session.assert('invoice', 'approve', invoice),
    ).resolves.toBeUndefined();
  });

  it('explains the project delete decision', async () => {
    const explanation = await session.explain('project', 'delete', project);

    expect(explanation.allowed).toBe(true);
    expect(explanation.grantedBy).toEqual({
      sourceScope: 'org:acme',
      sourceRole: 'editor',
      action: 'delete',
    });
  });

  it('lists allowed project actions', async () => {
    await expect(session.allowedActions('project', project)).resolves.toEqual([
      'read',
      'update',
      'delete',
    ]);
  });

  it('denies invoice approval above the approval limit (default deny via conditions)', async () => {
    const expensive: Invoice = { id: 'i2', amount: 50_000 };

    await expect(session.can('invoice', 'approve', expensive)).resolves.toBe(
      false,
    );
  });
});
