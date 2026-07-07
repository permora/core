import type { ResolvedRole } from '../roles/role.types';
import { compileRoleGrants } from './grant-compiler';
import type { CompiledGrant, GrantIndex } from './grant.types';

/**
 * Builds the per-session grant index from the reachable roles.
 * Multiple grants for the same resource/action accumulate (OR semantics).
 */
export function createGrantIndex(roles: readonly ResolvedRole[]): GrantIndex {
  const index = new Map<string, Map<string, CompiledGrant[]>>();

  for (const role of roles) {
    for (const grant of compileRoleGrants(role)) {
      let actions = index.get(grant.resource);
      if (actions === undefined) {
        actions = new Map();
        index.set(grant.resource, actions);
      }

      let grants = actions.get(grant.action);
      if (grants === undefined) {
        grants = [];
        actions.set(grant.action, grants);
      }

      grants.push(grant);
    }
  }

  return index;
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
