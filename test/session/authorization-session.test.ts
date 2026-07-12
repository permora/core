import { describe, expect, it } from 'vitest';
import { createAuthorization } from '../../src/authorization';
import { AuthorizationDeniedError } from '../../src/errors';
import { definePermissions } from '../../src/permissions';
import { defineResource, defineResources } from '../../src/resources';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

import { scopedPermissions } from '../../src/scoped';

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
      admin: {
        project: ['*'],
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

const user: User = { id: 'user_123', approvalLimit: 10_000 };
const ownProject: Project = { id: 'p1', ownerId: 'user_123' };
const otherProject: Project = { id: 'p2', ownerId: 'someone_else' };

describe('can', () => {
  it('allows unconditional grants without a resource instance', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    expect(session.can('project', 'read')).toBe(true);
  });

  it('denies actions without grants (default deny)', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    expect(session.can('project', 'update')).toBe(false);
  });

  it('evaluates conditions with the resource instance', () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    expect(session.can('project', 'delete', ownProject)).toBe(true);
    expect(session.can('project', 'delete', otherProject)).toBe(false);
  });

  it('allows via wildcard grants', () => {
    const session = authz.session({ subject: user, roles: ['admin'] });

    expect(session.can('project', 'delete', otherProject)).toBe(true);
  });

  it('combines grants from multiple roles', () => {
    const session = authz.session({
      subject: user,
      roles: ['viewer', 'admin'],
    });

    expect(session.can('project', 'update')).toBe(true);
  });

  it('applies scope overrides: org:acme editor deletes unconditionally', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['editor'],
    });

    expect(session.can('project', 'delete', otherProject)).toBe(true);
  });

  it('resolves inherited roles across scopes', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    // manager → org:acme.editor → *.viewer
    expect(session.can('project', 'read')).toBe(true);
    expect(session.can('invoice', 'read')).toBe(true);
  });

  it('treats sessions without scope as scope "*"', () => {
    const implicit = authz.session({ subject: user, roles: ['editor'] });
    const explicit = authz.session({
      subject: user,
      scope: '*',
      roles: ['editor'],
    });

    expect(implicit.can('project', 'update')).toBe(true);
    expect(explicit.can('project', 'update')).toBe(true);
    expect(implicit.scope).toBe('*');
    expect(explicit.scope).toBe('*');
  });
});

describe('cannot', () => {
  it('is the negation of can', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    expect(session.cannot('project', 'read')).toBe(false);
    expect(session.cannot('project', 'update')).toBe(true);
  });
});

describe('assert', () => {
  it('resolves when allowed', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    expect(session.assert('project', 'read')).toBeUndefined();
  });

  it('throws AuthorizationDeniedError with decision details when denied', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const bigInvoice: Invoice = { id: 'i1', amount: 50_000 };

    let caught: unknown;
    try {
      session.assert('invoice', 'approve', bigInvoice);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuthorizationDeniedError);
    const denied = caught as AuthorizationDeniedError;
    expect(denied.code).toBe('AUTHZ_DENIED');
    expect(denied.subject).toBe(user);
    expect(denied.scope).toBe('org:acme');
    expect(denied.roles).toEqual(['manager']);
    expect(denied.resource).toBe('invoice');
    expect(denied.action).toBe('approve');
  });
});

describe('explain', () => {
  it('identifies the grant responsible for the decision', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    const explanation = session.explain('project', 'read');

    expect(explanation.allowed).toBe(true);
    expect(explanation.reason).toBe('GRANT_MATCHED');
    expect(explanation.grantedBy).toEqual({
      sourceScope: '*',
      sourceRole: 'viewer',
      action: 'read',
    });
  });

  it('identifies the condition responsible for the decision', () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    const explanation = session.explain('project', 'delete', ownProject);

    expect(explanation.allowed).toBe(true);
    expect(explanation.reason).toBe('CONDITION_MATCHED');
    expect(explanation.grantedBy?.sourceRole).toBe('editor');
    expect(explanation.evaluatedGrants).toEqual([
      {
        sourceScope: '*',
        sourceRole: 'editor',
        action: 'delete',
        conditional: true,
        matched: true,
      },
    ]);
  });

  it('explains denials without matching grants', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    const explanation = session.explain('invoice', 'approve');

    expect(explanation.allowed).toBe(false);
    expect(explanation.reason).toBe('NO_MATCHING_GRANT');
    expect(explanation.evaluatedGrants).toEqual([]);
    expect(explanation.grantedBy).toBeUndefined();
  });

  it('explains denials after all conditions fail', () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    const explanation = session.explain('project', 'delete', otherProject);

    expect(explanation.allowed).toBe(false);
    expect(explanation.reason).toBe('ALL_CONDITIONS_FAILED');
    expect(explanation.evaluatedGrants[0]?.matched).toBe(false);
  });

  it('includes scope, roles, resource and action', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const explanation = session.explain('invoice', 'read');

    expect(explanation.scope).toBe('org:acme');
    expect(explanation.roles).toEqual(['manager']);
    expect(explanation.resource).toBe('invoice');
    expect(explanation.action).toBe('read');
  });
});

describe('allowedActions', () => {
  it('lists unconditional permissions', () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    expect(session.allowedActions('project')).toEqual(['read']);
  });

  it('evaluates conditions against the resource instance', () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    expect(session.allowedActions('project', ownProject)).toEqual([
      'read',
      'update',
      'delete',
    ]);

    expect(session.allowedActions('project', otherProject)).toEqual([
      'read',
      'update',
    ]);
  });

  it('expands wildcard using the declared action list', () => {
    const session = authz.session({ subject: user, roles: ['admin'] });

    expect(session.allowedActions('project')).toEqual([
      'read',
      'update',
      'delete',
    ]);
  });

  it('includes inherited permissions from multiple roles', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const smallInvoice: Invoice = { id: 'i1', amount: 500 };

    expect(session.allowedActions('invoice', smallInvoice)).toEqual([
      'read',
      'approve',
    ]);
  });
});

describe('permissionGraph', () => {
  it('returns a synchronous snapshot without evaluating conditions', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const snapshot = session.permissionGraph();

    expect(snapshot.scope).toBe('org:acme');
    expect(snapshot.roles).toEqual(['manager']);
    expect(
      snapshot.resolvedRoles.map((r) => `${r.sourceScope}.${r.role}`),
    ).toEqual(['org:acme.manager', 'org:acme.editor', '*.viewer']);
  });

  it('reports conditional grants without running when', () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    const editor = session
      .permissionGraph()
      .resolvedRoles.find((r) => r.role === 'editor');

    expect(editor?.permissions).toContainEqual({
      resource: 'project',
      action: 'delete',
      conditional: true,
    });
  });

  it('reflects scoped overrides in permissions', () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['editor'],
    });

    const editor = session
      .permissionGraph()
      .resolvedRoles.find((r) => r.role === 'editor');

    expect(editor?.sourceScope).toBe('org:acme');
    expect(editor?.permissions).toContainEqual({
      resource: 'project',
      action: 'delete',
      conditional: false,
    });
  });
});
