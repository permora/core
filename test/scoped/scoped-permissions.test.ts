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
  invoice: defineResource<Invoice>({
    actions: ['read', 'approve', 'create'],
  }),
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
});

describe('scopedPermissions', () => {
  it('accepts flat scoped definitions', () => {
    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(
      resources,
      {
        'org:acme': { admin: { invoice: ['read'] } },
      },
      { resolver: scopedPermissions() },
    );

    expect(permissions['org:acme'].admin).toEqual({ invoice: ['read'] });
  });

  it('accepts nested scoped definitions', () => {
    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(
      resources,
      {
        arasaka: {
          staging: { admin: { invoice: ['create', 'read'] } },
        },
      },
      { resolver: scopedPermissions({ nested: true }) },
    );

    expect(permissions['arasaka:staging'].admin).toEqual({
      invoice: ['create', 'read'],
    });
  });

  it('preserves extends and when through nested interpretation', async () => {
    const when = ({
      subject,
      resource,
    }: {
      subject: User;
      resource: Invoice;
    }) => resource.amount <= 100;

    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(
      resources,
      {
        arasaka: {
          staging: {
            approver: {
              extends: ['reader'],
              invoice: [{ action: 'approve', when }],
            },
            reader: { invoice: ['read'] },
          },
        },
      },
      { resolver: scopedPermissions({ nested: true }) },
    );

    const authz = createAuthorization({ resources, permissions });
    const session = authz.session({
      subject: { id: 'u1' },
      scope: 'arasaka:staging',
      roles: ['approver'],
    });

    await expect(
      session.can('invoice', 'approve', { id: 'i1', amount: 50 }),
    ).resolves.toBe(true);
    await expect(
      session.can('invoice', 'approve', { id: 'i2', amount: 500 }),
    ).resolves.toBe(false);
  });
});
