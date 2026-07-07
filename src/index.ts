/**
 * TypeScript library for permission checks and management.
 *
 * @packageDocumentation
 */

/**
 * Checks whether a set of granted permissions includes the required permission.
 */
export function can(grants: readonly string[], required: string): boolean {
  return grants.includes(required);
}

export const Permissions = { can } as const;
