import { describe, expect, it } from 'vitest';
import { createAuthorization } from '../../src/authorization';
import { InvalidPermissionDefinitionError } from '../../src/errors';
import { definePermissions } from '../../src/permissions';
import { definePermissionInterpreter } from '../../src/permissions/define-permission-interpreter';
import { defineResource, defineResources } from '../../src/resources';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: defineResource<Project>({
    actions: ['read', 'update', 'delete'],
  }),
});

describe('definePermissionInterpreter', () => {
  it('returns the interpreter unchanged', () => {
    const interpreter = definePermissionInterpreter({
      name: 'test',
      interpret: (input) => input as never,
    });

    expect(interpreter.name).toBe('test');
  });
});

describe('definePermissions resolver option', () => {
  const prefixInterpreter = definePermissionInterpreter<
    Record<string, Record<string, { project: string[] }>>
  >({
    name: 'prefix-scopes',
    interpret(input) {
      return Object.fromEntries(
        Object.entries(input).map(([scope, roles]) => [
          `tenant:${scope}`,
          roles,
        ]),
      );
    },
  });

  it('transforms custom input through a resolver', () => {
    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(
      resources,
      {
        acme: { viewer: { project: ['read'] } },
      },
      { resolver: prefixInterpreter },
    );

    expect(permissions['tenant:acme'].viewer).toEqual({
      project: ['read'],
    });
  });

  it('validates resolver output at definition time', () => {
    const badInterpreter = definePermissionInterpreter({
      interpret: () => ({
        '*': { editor: { project: ['unknown-action'] } },
      }),
    });

    const permissionBuilder = definePermissions<User>();

    expect(() =>
      permissionBuilder(resources, {}, { resolver: badInterpreter }),
    ).toThrow(InvalidPermissionDefinitionError);
  });

  it('works end-to-end with createAuthorization', async () => {
    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(
      resources,
      {
        acme: { viewer: { project: ['read'] } },
      },
      { resolver: prefixInterpreter },
    );

    const authz = createAuthorization({ resources, permissions });
    const session = authz.session({
      subject: { id: 'u1' },
      scope: 'tenant:acme',
      roles: ['viewer'],
    });

    await expect(session.can('project', 'read')).resolves.toBe(true);
  });
});
