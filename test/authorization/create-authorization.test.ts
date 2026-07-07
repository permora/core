import { describe, expect, it } from 'vitest';
import { createAuthorization } from '../../src/authorization';
import {
  InvalidPermissionDefinitionError,
  UnknownRoleError,
} from '../../src/errors';
import { definePermissions } from '../../src/permissions';
import { defineResources } from '../../src/resources';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: {
    actions: ['read', 'update', 'delete'],
    resource: {} as Project,
  },
});

describe('createAuthorization', () => {
  it('creates an engine from a valid definition', () => {
    const permissions = definePermissions<User>()(resources, {
      '*': { viewer: { project: ['read'] } },
    });

    const authz = createAuthorization({ resources, permissions });

    expect(authz).toBeDefined();
  });

  it('rejects unknown resources eagerly', () => {
    const permissions = {
      '*': { viewer: { document: ['read'] } },
    };

    expect(() =>
      createAuthorization({
        resources,
        permissions: permissions as never,
      }),
    ).toThrow(InvalidPermissionDefinitionError);
  });

  it('rejects unknown actions eagerly', () => {
    const permissions = {
      '*': { viewer: { project: ['approve'] } },
    };

    expect(() =>
      createAuthorization({
        resources,
        permissions: permissions as never,
      }),
    ).toThrow(InvalidPermissionDefinitionError);
  });

  it('accepts wildcard actions', () => {
    const permissions = definePermissions<User>()(resources, {
      '*': { admin: { project: ['*'] } },
    });

    expect(() => createAuthorization({ resources, permissions })).not.toThrow();
  });

  it('rejects malformed permission entries', () => {
    const permissions = {
      '*': { viewer: { project: [42] } },
    };

    expect(() =>
      createAuthorization({
        resources,
        permissions: permissions as never,
      }),
    ).toThrow(InvalidPermissionDefinitionError);
  });

  it('rejects malformed extends', () => {
    const permissions = {
      '*': { viewer: { extends: 'other' } },
    };

    expect(() =>
      createAuthorization({
        resources,
        permissions: permissions as never,
      }),
    ).toThrow(InvalidPermissionDefinitionError);
  });

  it('does not validate inheritance eagerly: cycles in unused branches do not block creation', () => {
    const permissions = definePermissions<User>()(resources, {
      '*': {
        viewer: { project: ['read'] },
        broken: { extends: ['alsoBroken'] },
        alsoBroken: { extends: ['broken'] },
      },
    });

    const authz = createAuthorization({ resources, permissions });

    expect(() =>
      authz.session({ subject: { id: 'u1' }, roles: ['viewer'] }),
    ).not.toThrow();
  });

  it('throws UnknownRoleError when the session uses an unknown role', () => {
    const permissions = definePermissions<User>()(resources, {
      '*': { viewer: { project: ['read'] } },
    });

    const authz = createAuthorization({ resources, permissions });

    expect(() =>
      authz.session({ subject: { id: 'u1' }, roles: ['ghost'] }),
    ).toThrow(UnknownRoleError);
  });
});
