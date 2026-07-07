import { DEFAULT_SCOPE } from '../permissions/constants';
import type { AnyPermissionsDefinition, ResolvedRole } from './role.types';

/**
 * Resolves a role following `permissions[scope]?.[role] ?? permissions["*"]?.[role]`.
 *
 * Fallback happens per role: a role defined in the specific scope fully
 * replaces the default-scope definition (no merge).
 */
export function resolveRole(
  permissions: AnyPermissionsDefinition,
  scope: string,
  role: string,
): ResolvedRole | undefined {
  const specific = permissions[scope]?.[role];
  if (specific !== undefined) {
    return { sourceScope: scope, role, definition: specific };
  }

  const fallback = permissions[DEFAULT_SCOPE]?.[role];
  if (fallback !== undefined) {
    return { sourceScope: DEFAULT_SCOPE, role, definition: fallback };
  }

  return undefined;
}
