import type { ResolvedRole } from '../roles/role.types';
import type { ResourcesShape } from '../resources/resource.types';
import { compileRoleGrants } from './grant-compiler';
import type { CompiledGrant, GrantIndex } from './grant.types';

/**
 * Builds a grant index from a flat list of compiled grants.
 * Multiple grants for the same resource/action accumulate (OR semantics).
 */
export function buildGrantIndex(grants: readonly CompiledGrant[]): GrantIndex {
  const index = new Map<string, Map<string, CompiledGrant[]>>();

  for (const grant of grants) {
    let actions = index.get(grant.resource);
    if (actions === undefined) {
      actions = new Map();
      index.set(grant.resource, actions);
    }

    let grantList = actions.get(grant.action);
    if (grantList === undefined) {
      grantList = [];
      actions.set(grant.action, grantList);
    }

    grantList.push(grant);
  }

  return index;
}

/**
 * Builds the per-session grant index from the reachable roles.
 * Multiple grants for the same resource/action accumulate (OR semantics).
 */
export function createGrantIndex(
  roles: readonly ResolvedRole[],
  resources: ResourcesShape,
): GrantIndex {
  const grants: CompiledGrant[] = [];

  for (const role of roles) {
    grants.push(...compileRoleGrants(role, resources));
  }

  return buildGrantIndex(grants);
}

/**
 * Returns the candidate grants for a resource/action pair:
 * exact grants plus wildcard grants (`"*"`), in that order.
 */
export function lookupGrants(
  index: GrantIndex,
  resource: string,
  action: string,
): CompiledGrant[] {
  const actions = index.get(resource);
  if (actions === undefined) {
    return [];
  }

  const exact = actions.get(action) ?? [];
  const wildcard = action === '*' ? [] : (actions.get('*') ?? []);

  return [...exact, ...wildcard];
}
