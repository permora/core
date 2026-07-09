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
    if (!isPlainObject(permission) && typeof permission !== 'string') {
      throw new InvalidPermissionDefinitionError(
        `Invalid permission entry in "${scope}.${role}.${resource}": expected an action string or { action, when? } or { action, condition }`,
      );
    }

    if (typeof permission === 'string') {
      validateAction(config, resource, scope, role, permission);
      continue;
    }

    const action =
      typeof permission.action === 'string' ? permission.action : undefined;

    if (action === undefined) {
      throw new InvalidPermissionDefinitionError(
        `Invalid permission entry in "${scope}.${role}.${resource}": expected an action string or { action, when? } or { action, condition }`,
      );
    }

    const hasWhen = 'when' in permission && permission.when !== undefined;
    const condition =
      'condition' in permission && typeof permission.condition === 'string'
        ? permission.condition
        : undefined;

    if (hasWhen && condition !== undefined) {
      throw new InvalidPermissionDefinitionError(
        `Permission in "${scope}.${role}.${resource}" cannot define both "when" and "condition"`,
      );
    }

    if (condition !== undefined) {
      const registry = config.conditions;
      if (registry === undefined || registry[condition] === undefined) {
        throw new InvalidPermissionDefinitionError(
          `Unknown condition "${condition}" for resource "${resource}" in "${scope}.${role}"`,
        );
      }
    }

    validateAction(config, resource, scope, role, action);
  }
}

function validateAction(
  config: ResourcesShape[string],
  resource: string,
  scope: string,
  role: string,
  action: string,
): void {
  if (action !== '*' && !config.actions.includes(action)) {
    throw new InvalidPermissionDefinitionError(
      `Unknown action "${action}" for resource "${resource}" in "${scope}.${role}" (valid: ${config.actions.join(', ')})`,
    );
  }
}
