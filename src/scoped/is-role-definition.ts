/**
 * Returns true when `value` looks like a role definition: keys are either
 * `extends` (array) or resource names (permission arrays).
 */
export function isRoleDefinition(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value).every(([key, entry]) =>
    key === 'extends' ? Array.isArray(entry) : Array.isArray(entry),
  );
}

/**
 * Returns true when every value in `value` is a role definition.
 */
export function isRoleMap(value: unknown): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isRoleDefinition);
}
