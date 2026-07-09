import { compileRoleGrants } from '../grants/grant-compiler';
import type { ResolvedRole } from '../roles/role.types';
import type { ResourcesShape } from '../resources/resource.types';
import type {
  PermissionGraphRole,
  SessionPermissionGraph,
} from './session.types';

/**
 * Serializes the reachable role graph into a JSON-friendly snapshot.
 * Reuses the same grant normalization as session compilation.
 */
export function serializePermissionGraph(input: {
  readonly scope: string;
  readonly roles: readonly string[];
  readonly resolvedRoles: readonly ResolvedRole[];
  readonly resources?: ResourcesShape;
}): SessionPermissionGraph {
  return {
    scope: input.scope,
    roles: input.roles,
    resolvedRoles: input.resolvedRoles.map((role) =>
      toPermissionGraphRole(role, input.resources),
    ),
  };
}

function toPermissionGraphRole(
  role: ResolvedRole,
  resources?: ResourcesShape,
): PermissionGraphRole {
  const extendsList = role.definition.extends;

  return {
    sourceScope: role.sourceScope,
    role: role.role,
    ...(extendsList !== undefined && extendsList.length > 0
      ? { extends: extendsList }
      : {}),
    permissions: compileRoleGrants(role, resources).map((grant) => ({
      resource: grant.resource,
      action: grant.action,
      conditional: grant.when !== undefined || grant.conditionId !== undefined,
      ...(grant.conditionId !== undefined
        ? { condition: grant.conditionId }
        : {}),
    })),
  };
}
