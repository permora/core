import { describe, expect, it } from 'vitest';
import {
  AuthorizationDeniedError,
  createAuthorization,
  definePermissions,
  defineResources,
} from '../src/index';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

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

const permissions = definePermissions<User>()(resources, {
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
});

const authz = createAuthorization({ resources, permissions });

describe('multi-tenant authorization', () => {
  const subject: User = { id: 'user_123', approvalLimit: 10_000 };
  const foreignProject: Project = { id: 'p2', ownerId: 'someone_else' };
  const smallInvoice: Invoice = { id: 'i1', amount: 5000 };
  const largeInvoice: Invoice = { id: 'i2', amount: 50_000 };

  it('combines scope overrides with fallback inheritance', async () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    await expect(session.can('project', 'read')).resolves.toBe(true);
    await expect(session.can('project', 'update')).resolves.toBe(true);
    await expect(session.can('invoice', 'read')).resolves.toBe(true);
  });

  it('lets a scoped override replace a stricter default-scope condition', async () => {
    const acmeSession = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['editor'],
    });
    const defaultSession = authz.session({
      subject,
      roles: ['editor'],
    });

    await expect(acmeSession.can('project', 'delete', foreignProject)).resolves.toBe(
      true,
    );
    await expect(
      defaultSession.can('project', 'delete', foreignProject),
    ).resolves.toBe(false);
  });

  it('evaluates scoped conditional grants against the tenant subject', async () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    await expect(session.can('invoice', 'approve', smallInvoice)).resolves.toBe(
      true,
    );
    await expect(session.can('invoice', 'approve', largeInvoice)).resolves.toBe(
      false,
    );
  });

  it('explains which scoped role granted the decision', async () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const explanation = await session.explain('project', 'delete', foreignProject);

    expect(explanation.allowed).toBe(true);
    expect(explanation.grantedBy).toEqual({
      sourceScope: 'org:acme',
      sourceRole: 'editor',
      action: 'delete',
    });
  });

  it('preserves tenant context in denied assertions', async () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    let caught: unknown;
    try {
      await session.assert('invoice', 'approve', largeInvoice);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuthorizationDeniedError);
    expect((caught as AuthorizationDeniedError).scope).toBe('org:acme');
    expect((caught as AuthorizationDeniedError).roles).toEqual(['manager']);
  });
});
