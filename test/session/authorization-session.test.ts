import { describe, expect, it } from 'vitest';
import { createAuthorization } from '../../src/authorization';
import { AuthorizationDeniedError } from '../../src/errors';
import { definePermissions } from '../../src/permissions';
import { defineResources } from '../../src/resources';

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
  it('allows unconditional grants without a resource instance', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    await expect(session.can('project', 'read')).resolves.toBe(true);
  });

  it('denies actions without grants (default deny)', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    await expect(session.can('project', 'update')).resolves.toBe(false);
  });

  it('evaluates conditions with the resource instance', async () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    await expect(session.can('project', 'delete', ownProject)).resolves.toBe(
      true,
    );
    await expect(session.can('project', 'delete', otherProject)).resolves.toBe(
      false,
    );
  });

  it('allows via wildcard grants', async () => {
    const session = authz.session({ subject: user, roles: ['admin'] });

    await expect(session.can('project', 'delete', otherProject)).resolves.toBe(
      true,
    );
  });

  it('combines grants from multiple roles', async () => {
    const session = authz.session({
      subject: user,
      roles: ['viewer', 'admin'],
    });

    await expect(session.can('project', 'update')).resolves.toBe(true);
  });

  it('applies scope overrides: org:acme editor deletes unconditionally', async () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['editor'],
    });

    await expect(session.can('project', 'delete', otherProject)).resolves.toBe(
      true,
    );
  });

  it('resolves inherited roles across scopes', async () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    // manager → org:acme.editor → *.viewer
    await expect(session.can('project', 'read')).resolves.toBe(true);
    await expect(session.can('invoice', 'read')).resolves.toBe(true);
  });

  it('treats sessions without scope as scope "*"', async () => {
    const implicit = authz.session({ subject: user, roles: ['editor'] });
    const explicit = authz.session({
      subject: user,
      scope: '*',
      roles: ['editor'],
    });

    await expect(implicit.can('project', 'update')).resolves.toBe(true);
    await expect(explicit.can('project', 'update')).resolves.toBe(true);
    expect(implicit.scope).toBe('*');
    expect(explicit.scope).toBe('*');
  });
});

describe('cannot', () => {
  it('is the negation of can', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    await expect(session.cannot('project', 'read')).resolves.toBe(false);
    await expect(session.cannot('project', 'update')).resolves.toBe(true);
  });
});

describe('assert', () => {
  it('resolves when allowed', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    await expect(session.assert('project', 'read')).resolves.toBeUndefined();
  });

  it('throws AuthorizationDeniedError with decision details when denied', async () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const bigInvoice: Invoice = { id: 'i1', amount: 50_000 };

    let caught: unknown;
    try {
      await session.assert('invoice', 'approve', bigInvoice);
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
  it('identifies the grant responsible for the decision', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    const explanation = await session.explain('project', 'read');

    expect(explanation.allowed).toBe(true);
    expect(explanation.reason).toBe('GRANT_MATCHED');
    expect(explanation.grantedBy).toEqual({
      sourceScope: '*',
      sourceRole: 'viewer',
      action: 'read',
    });
  });

  it('identifies the condition responsible for the decision', async () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    const explanation = await session.explain('project', 'delete', ownProject);

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

  it('explains denials without matching grants', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    const explanation = await session.explain('invoice', 'approve');

    expect(explanation.allowed).toBe(false);
    expect(explanation.reason).toBe('NO_MATCHING_GRANT');
    expect(explanation.evaluatedGrants).toEqual([]);
    expect(explanation.grantedBy).toBeUndefined();
  });

  it('explains denials after all conditions fail', async () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    const explanation = await session.explain(
      'project',
      'delete',
      otherProject,
    );

    expect(explanation.allowed).toBe(false);
    expect(explanation.reason).toBe('ALL_CONDITIONS_FAILED');
    expect(explanation.evaluatedGrants[0]?.matched).toBe(false);
  });

  it('includes scope, roles, resource and action', async () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const explanation = await session.explain('invoice', 'read');

    expect(explanation.scope).toBe('org:acme');
    expect(explanation.roles).toEqual(['manager']);
    expect(explanation.resource).toBe('invoice');
    expect(explanation.action).toBe('read');
  });
});

describe('allowedActions', () => {
  it('lists unconditional permissions', async () => {
    const session = authz.session({ subject: user, roles: ['viewer'] });

    await expect(session.allowedActions('project')).resolves.toEqual(['read']);
  });

  it('evaluates conditions against the resource instance', async () => {
    const session = authz.session({ subject: user, roles: ['editor'] });

    await expect(
      session.allowedActions('project', ownProject),
    ).resolves.toEqual(['read', 'update', 'delete']);

    await expect(
      session.allowedActions('project', otherProject),
    ).resolves.toEqual(['read', 'update']);
  });

  it('expands wildcard using the declared action list', async () => {
    const session = authz.session({ subject: user, roles: ['admin'] });

    await expect(session.allowedActions('project')).resolves.toEqual([
      'read',
      'update',
      'delete',
    ]);
  });

  it('includes inherited permissions from multiple roles', async () => {
    const session = authz.session({
      subject: user,
      scope: 'org:acme',
      roles: ['manager'],
    });

    const smallInvoice: Invoice = { id: 'i1', amount: 500 };

    await expect(
      session.allowedActions('invoice', smallInvoice),
    ).resolves.toEqual(['read', 'approve']);
  });
});
