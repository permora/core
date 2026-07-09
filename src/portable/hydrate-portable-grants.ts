import type { AnyCondition, CompiledGrant } from '../grants/grant.types';
import type { ResourcesShape } from '../resources/resource.types';
import type { ResolvedRole } from '../roles/role.types';
import type { PortableGrant } from './portable.types';

/**
 * Converts portable grants into compiled grants with `when` hydrated from
 * the resources condition registry.
 */
export function hydratePortableGrants(
  grants: readonly PortableGrant[],
  resources: ResourcesShape,
): CompiledGrant[] {
  return grants.map((grant) => {
    const when =
      grant.condition !== undefined
        ? (resources[grant.resource]?.conditions?.[grant.condition] as
            AnyCondition | undefined)
        : undefined;

    return {
      sourceScope: grant.sourceScope,
      sourceRole: grant.sourceRole,
      resource: grant.resource,
      action: grant.action,
      ...(grant.condition !== undefined
        ? { conditionId: grant.condition }
        : {}),
      ...(when !== undefined ? { when } : {}),
    };
  });
}

/**
 * Reconstructs minimal resolved roles from flat grants for
 * `session.permissionGraph()`.
 */
export function resolvedRolesFromGrants(
  grants: readonly CompiledGrant[],
): ResolvedRole[] {
  const roleMap = new Map<
    string,
    ResolvedRole & { definition: Record<string, unknown> }
  >();

  for (const grant of grants) {
    const key = `${grant.sourceScope}\0${grant.sourceRole}`;
    let role = roleMap.get(key);

    if (role === undefined) {
      role = {
        sourceScope: grant.sourceScope,
        role: grant.sourceRole,
        definition: {},
      };
      roleMap.set(key, role);
    }

    const existing = role.definition[grant.resource];
    const permissions = Array.isArray(existing) ? [...existing] : [];

    if (grant.conditionId !== undefined) {
      permissions.push({ action: grant.action, condition: grant.conditionId });
    } else if (grant.when !== undefined) {
      permissions.push({ action: grant.action, when: grant.when });
    } else {
      permissions.push(grant.action);
    }

    role.definition[grant.resource] = permissions;
  }

  return [...roleMap.values()];
}
