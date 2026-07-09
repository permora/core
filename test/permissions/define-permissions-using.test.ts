import { describe, expect, it } from 'vitest';
import { createAuthorization } from '../../src/authorization';
import { InvalidPermissionDefinitionError } from '../../src/errors';
import { definePermissions } from '../../src/permissions';
import { definePermissionInterpreter } from '../../src/permissions/define-permission-interpreter';
import { defineResource, defineResources } from '../../src/resources';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
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

describe('definePermissions .with(interpreter)', () => {
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

  it('transforms custom input through an interpreter', () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(prefixInterpreter)
      .from({
        acme: { viewer: { project: ['read'] } },
      });

    expect(permissions['tenant:acme'].viewer).toEqual({
      project: ['read'],
    });
  });

  it('validates interpreter output at definition time', () => {
    const badInterpreter = definePermissionInterpreter({
      interpret: () => ({
        '*': { editor: { project: ['unknown-action'] } },
      }),
    });

    expect(() =>
      definePermissions({ resources })
        .forSubject<User>()
        .with(badInterpreter)
        .from({}),
    ).toThrow(InvalidPermissionDefinitionError);
  });

  it('works end-to-end with createAuthorization', async () => {
    const permissions = definePermissions({ resources })
      .forSubject<User>()
      .with(prefixInterpreter)
      .from({
        acme: { viewer: { project: ['read'] } },
      });

    const authz = createAuthorization({ resources, permissions });
    const session = authz.session({
      subject: { id: 'u1' },
      scope: 'tenant:acme',
      roles: ['viewer'],
    });

    await expect(session.can('project', 'read')).resolves.toBe(true);
  });
});
