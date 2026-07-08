import type { AnyRoleDefinition } from './role.types';

/**
 * Merges a default-scope role definition with a specific-scope definition.
 *
 * - `extends`: deduplicated union (`default` first, then `specific`)
 * - Per resource: concatenates permission arrays (OR semantics at evaluation)
 * - Non-array keys from `specific` override `default`
 */
export function mergeRoleDefinitions(
  base: AnyRoleDefinition,
  specific: AnyRoleDefinition,
): AnyRoleDefinition {
  const merged: Record<string, unknown> = { ...base };

  const extendsList = [...(base.extends ?? []), ...(specific.extends ?? [])];
  const uniqueExtends = [...new Set(extendsList)];
  if (uniqueExtends.length > 0) {
    merged.extends = uniqueExtends;
  }

  for (const [key, value] of Object.entries(specific)) {
    if (key === 'extends') {
      continue;
    }

    const baseValue = merged[key];
    if (Array.isArray(value) && Array.isArray(baseValue)) {
      merged[key] = [...baseValue, ...value];
    } else {
      merged[key] = value;
    }
  }

  return merged;
}
