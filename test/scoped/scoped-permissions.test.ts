import { describe, expect, it } from 'vitest';
import { flattenNestedScopes } from '../../src/scoped/flatten-nested-scopes';
import {
  isRoleDefinition,
  isRoleMap,
} from '../../src/scoped/is-role-definition';
import { scopedPermissions } from '../../src/scoped/scoped-permissions';
import { definePermissions } from '../../src/permissions';
import { defineResource, defineResources } from '../../src/resources';
import { createAuthorization } from '../../src/authorization';

type User = { id: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  invoice: defineResource<Invoice>().actions(['read', 'approve', 'create']),
});

describe('isRoleDefinition', () => {
  it('detects role definitions', () => {
    expect(isRoleDefinition({ invoice: ['read'] })).toBe(true);
    expect(isRoleDefinition({ extends: ['viewer'], invoice: ['read'] })).toBe(
      true,
    );
  });

  it('rejects scope nodes', () => {
    expect(isRoleDefinition({ admin: { invoice: ['read'] } })).toBe(false);
  });
});

describe('isRoleMap', () => {
  it('detects role maps', () => {
    expect(isRoleMap({ admin: { invoice: ['read'] } })).toBe(true);
  });
});

describe('flattenNestedScopes', () => {
  it('flattens nested scope trees', () => {
    expect(
      flattenNestedScopes({
        arasaka: {
          staging: {
            admin: { invoice: ['create', 'read'] },
          },
        },
      }),
    ).toEqual({
      'arasaka:staging': {
        admin: { invoice: ['create', 'read'] },
      },
    });
  });

  it('passes through explicit default scope nodes', () => {
    expect(
      flattenNestedScopes({
        '*': { viewer: { invoice: ['read'] } },
        arasaka: { staging: { admin: { invoice: ['create'] } } },
      }),
    ).toEqual({
      '*': { viewer: { invoice: ['read'] } },
      'arasaka:staging': { admin: { invoice: ['create'] } },
    });
  });

  it('joins segments with a custom separator', () => {
    expect(
      flattenNestedScopes(
        {
          arasaka: {
            staging: {
              admin: { invoice: ['create', 'read'] },
            },
          },
        },
        [],
        '__',
      ),
    ).toEqual({
      arasaka__staging: {
        admin: { invoice: ['create', 'read'] },
      },
    });
  });
});

describe('scopedPermissions', () => {
  it('accepts flat scoped definitions', () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions())
      .from({
        'org:acme': { admin: { invoice: ['read'] } },
      });

    expect(permissions['org:acme'].admin).toEqual({ invoice: ['read'] });
  });

  it('accepts nested scoped definitions', () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions({ nested: true }))
      .from({
        arasaka: {
          staging: { admin: { invoice: ['create', 'read'] } },
        },
      });

    expect(permissions['arasaka:staging'].admin).toEqual({
      invoice: ['create', 'read'],
    });
  });

  it('uses custom separator when nested is true', () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions({ nested: true, separator: '__' }))
      .from({
        arasaka: {
          staging: { admin: { invoice: ['read'] } },
        },
      });

    expect(permissions['arasaka__staging'].admin).toEqual({
      invoice: ['read'],
    });
  });

  it('ignores separator in flat mode', () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions({ separator: '__' }))
      .from({
        'org:acme': { admin: { invoice: ['read'] } },
      });

    expect(permissions['org:acme'].admin).toEqual({ invoice: ['read'] });
    expect(permissions['org__acme']).toBeUndefined();
  });

  it('resolves sessions with custom separator scope', () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions({ nested: true, separator: '__' }))
      .from({
        arasaka: {
          staging: { admin: { invoice: ['read'] } },
        },
      });

    const authz = createAuthorization({ resources, permissions });
    const session = authz.session({
      subject: { id: 'u1' },
      scope: 'arasaka__staging',
      roles: ['admin'],
    });

    expect(session.can('invoice', 'read')).toBe(true);
  });

  it('preserves extends and when through nested interpretation', () => {
    const when = ({
      subject,
      resource,
    }: {
      subject: User;
      resource: Invoice;
    }) => resource.amount <= 100;

    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions({ nested: true }))
      .from({
        arasaka: {
          staging: {
            approver: {
              extends: ['reader'],
              invoice: [{ action: 'approve', when }],
            },
            reader: { invoice: ['read'] },
          },
        },
      });

    const authz = createAuthorization({ resources, permissions });
    const session = authz.session({
      subject: { id: 'u1' },
      scope: 'arasaka:staging',
      roles: ['approver'],
    });

    expect(session.can('invoice', 'approve', { id: 'i1', amount: 50 })).toBe(
      true,
    );
    expect(session.can('invoice', 'approve', { id: 'i2', amount: 500 })).toBe(
      false,
    );
  });
});
