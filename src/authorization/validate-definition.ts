import { InvalidPermissionDefinitionError } from '../errors/invalid-permission-definition-error';
import type { ResourcesShape } from '../resources/resource.types';
import type { AnyPermissionsDefinition } from '../roles/role.types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Eagerly validates the statically verifiable invariants of a permission
 * definition (§34): structure, known resources, known actions and valid
 * wildcards. Costs O(total permissions) once at engine creation.
 *
 * Inheritance validation (unknown parents, cycles) stays lazy and happens
 * during session compilation, so unused broken branches never block
 * engine creation.
 */
export function validateDefinition(
  resources: ResourcesShape,
  permissions: AnyPermissionsDefinition,
): void {
  if (!isPlainObject(permissions)) {
    throw new InvalidPermissionDefinitionError(
      'Permission definition must be an object mapping scopes to roles',
    );
  }

  for (const [scope, roleMap] of Object.entries(permissions)) {
    if (!isPlainObject(roleMap)) {
      throw new InvalidPermissionDefinitionError(
        `Scope "${scope}" must map role names to role definitions`,
      );
    }

    for (const [role, definition] of Object.entries(roleMap)) {
      if (!isPlainObject(definition)) {
        throw new InvalidPermissionDefinitionError(
          `Role "${scope}.${role}" must be an object`,
        );
      }

      for (const [key, value] of Object.entries(definition)) {
        if (key === 'extends') {
          if (
            !Array.isArray(value) ||
            value.some((parent) => typeof parent !== 'string')
          ) {
            throw new InvalidPermissionDefinitionError(
              `"extends" of role "${scope}.${role}" must be an array of role names`,
            );
          }
          continue;
        }

        validateResourcePermissions(resources, scope, role, key, value);
      }
    }
  }
}

function validateResourcePermissions(
  resources: ResourcesShape,
  scope: string,
  role: string,
  resource: string,
  value: unknown,
): void {
  const config = resources[resource];
  if (config === undefined) {
    throw new InvalidPermissionDefinitionError(
      `Role "${scope}.${role}" references unknown resource "${resource}"`,
    );
  }

  if (!Array.isArray(value)) {
    throw new InvalidPermissionDefinitionError(
      `Permissions of "${scope}.${role}.${resource}" must be an array`,
    );
  }

  for (const permission of value) {
    const action =
      typeof permission === 'string'
        ? permission
        : isPlainObject(permission) && typeof permission.action === 'string'
          ? permission.action
          : undefined;

    if (action === undefined) {
      throw new InvalidPermissionDefinitionError(
        `Invalid permission entry in "${scope}.${role}.${resource}": expected an action string or { action, when? }`,
      );
    }

    if (action !== '*' && !config.actions.includes(action)) {
      throw new InvalidPermissionDefinitionError(
        `Unknown action "${action}" for resource "${resource}" in "${scope}.${role}" (valid: ${config.actions.join(', ')})`,
      );
    }
  }
}
