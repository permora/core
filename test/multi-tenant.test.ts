import { describe, expect, it } from 'vitest';
import {
  AuthorizationDeniedError,
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../src/index';
import { scopedPermissions } from '../src/scoped';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
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

  it('combines scope overrides with fallback inheritance', () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    expect(session.can('project', 'read')).toBe(true);
    expect(session.can('project', 'update')).toBe(true);
    expect(session.can('invoice', 'read')).toBe(true);
  });

  it('lets a scoped override replace a stricter default-scope condition', () => {
    const acmeSession = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['editor'],
    });
    const defaultSession = authz.session({
      subject,
      roles: ['editor'],
    });

    expect(acmeSession.can('project', 'delete', foreignProject)).toBe(true);
    expect(defaultSession.can('project', 'delete', foreignProject)).toBe(false);
  });

  it('evaluates scoped conditional grants against the tenant subject', () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    expect(session.can('invoice', 'approve', smallInvoice)).toBe(true);
    expect(session.can('invoice', 'approve', largeInvoice)).toBe(false);
  });

  it('explains which scoped role granted the decision', () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const explanation = session.explain('project', 'delete', foreignProject);

    expect(explanation.allowed).toBe(true);
    expect(explanation.grantedBy).toEqual({
      sourceScope: 'org:acme',
      sourceRole: 'editor',
      action: 'delete',
    });
  });

  it('preserves tenant context in denied assertions', () => {
    const session = authz.session({
      subject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    let caught: unknown;
    try {
      session.assert('invoice', 'approve', largeInvoice);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuthorizationDeniedError);
    expect((caught as AuthorizationDeniedError).scope).toBe('org:acme');
    expect((caught as AuthorizationDeniedError).roles).toEqual(['manager']);
  });
});
