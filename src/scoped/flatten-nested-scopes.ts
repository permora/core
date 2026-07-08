import { DEFAULT_SCOPE } from '../permissions/constants';
import { isRoleMap } from './is-role-definition';

/**
 * Flattens a nested scope tree into canonical `scope → roleMap` entries.
 *
 * @example
 * flattenNestedScopes({ arasaka: { staging: { admin: { invoice: ['read'] } } } })
 * // → { 'arasaka:staging': { admin: { invoice: ['read'] } } }
 */
export function flattenNestedScopes(
  node: Record<string, unknown>,
  segments: string[] = [],
  separator = ':',
): Record<string, unknown> {
  if (isRoleMap(node)) {
    const scope =
      segments.length > 0 ? segments.join(separator) : DEFAULT_SCOPE;
    return { [scope]: node };
  }

  const result: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(node)) {
    if (key === DEFAULT_SCOPE && isRoleMap(child)) {
      result[DEFAULT_SCOPE] = child;
      continue;
    }

    const flattened = flattenNestedScopes(
      child as Record<string, unknown>,
      [...segments, key],
      separator,
    );
    Object.assign(result, flattened);
  }

  return result;
}
