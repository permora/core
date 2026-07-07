import type { ResolvedRole } from '../roles/role.types';
import type { AnyCondition, CompiledGrant } from './grant.types';

type RawPermission =
  | string
  | {
      readonly action: string;
      readonly when?: AnyCondition;
    };

/**
 * Normalizes the permissions of a single resolved role into grants.
 * Wildcards are kept as `action: "*"` without expansion.
 */
export function compileRoleGrants(role: ResolvedRole): CompiledGrant[] {
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
      } else {
        grants.push({
          sourceScope: role.sourceScope,
          sourceRole: role.role,
          resource,
          action: permission.action,
          when: permission.when,
        });
      }
    }
  }

  return grants;
}
