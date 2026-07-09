import type { ResolvedRole } from '../roles/role.types';
import type { ResourcesShape } from '../resources/resource.types';
import type { AnyCondition, CompiledGrant } from './grant.types';

type RawPermission =
  | string
  | {
      readonly action: string;
      readonly when?: AnyCondition;
      readonly condition?: string;
    };

function resolveCondition(
  resources: ResourcesShape | undefined,
  resource: string,
  conditionId: string,
): AnyCondition | undefined {
  if (resources === undefined) {
    return undefined;
  }

  const registry = resources[resource]?.conditions;
  const fn = registry?.[conditionId];
  if (fn === undefined) {
    return undefined;
  }

  return fn as AnyCondition;
}

/**
 * Normalizes the permissions of a single resolved role into grants.
 * Wildcards are kept as `action: "*"` without expansion.
 *
 * When `resources` is provided, named `condition` ids are resolved to
 * `when` functions and stored as `conditionId` on the grant.
 */
export function compileRoleGrants(
  role: ResolvedRole,
  resources?: ResourcesShape,
): CompiledGrant[] {
  const grants: CompiledGrant[] = [];

  for (const [resource, permissions] of Object.entries(role.definition)) {
    if (resource === 'extends' || !Array.isArray(permissions)) {
      continue;
    }

    for (const permission of permissions as readonly RawPermission[]) {
      if (typeof permission === 'string') {
        grants.push({
          sourceScope: role.sourceScope,
          sourceRole: role.role,
          resource,
          action: permission,
        });
        continue;
      }

      const conditionId =
        typeof permission.condition === 'string'
          ? permission.condition
          : undefined;
      const when =
        conditionId !== undefined
          ? resolveCondition(resources, resource, conditionId)
          : permission.when;

      grants.push({
        sourceScope: role.sourceScope,
        sourceRole: role.role,
        resource,
        action: permission.action,
        ...(conditionId !== undefined ? { conditionId } : {}),
        ...(when !== undefined ? { when } : {}),
      });
    }
  }

  return grants;
}
