import type { CompiledGrant, GrantIndex } from '../grants/grant.types';

/**
 * Flattens a grant index into a list of compiled grants.
 */
export function flattenGrantIndex(index: GrantIndex): CompiledGrant[] {
  const grants: CompiledGrant[] = [];

  for (const actions of index.values()) {
    for (const grantList of actions.values()) {
      grants.push(...grantList);
    }
  }

  return grants;
}
