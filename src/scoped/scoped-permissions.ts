import { definePermissionInterpreter } from '../permissions/define-permission-interpreter';
import type { PermissionsShape } from '../permissions/permission.types';
import type { ResourcesShape } from '../resources/resource.types';
import { flattenNestedScopes } from './flatten-nested-scopes';
import { isRoleMap } from './is-role-definition';

export type ScopedPermissionsOptions = {
  /**
   * When true, interprets nested scope trees (org → env → roles).
   * When false (default), expects flat `scope → roleMap` keys.
   */
  readonly nested?: boolean;

  /**
   * Separator used to join nested scope segments (e.g. `org` + `staging` → `org:staging`).
   * Only applied when `nested: true`. Ignored in flat mode — scope keys must be
   * written exactly as they should appear at runtime.
   * Defaults to `':'`.
   */
  readonly separator?: string;
};

/**
 * Built-in permission definition interpreter for multi-tenant scoped
 * permissions. Import from `@permora/core/scoped` (tree-shakeable subpath).
 *
 * @example
 * import { scopedPermissions } from '@permora/core/scoped';
 *
 * const permissionBuilder = definePermissions<User>();
 * const permissions = permissionBuilder(
 *   resources,
 *   {
 *     '*': { viewer: { project: ['read'] } },
 *     'org:acme': { admin: { project: ['*'] } },
 *   },
 *   { resolver: scopedPermissions() },
 * );
 */
export function scopedPermissions<Subject = unknown, Context = undefined>(
  options: ScopedPermissionsOptions = {},
) {
  const nested = options.nested ?? false;
  const separator = options.separator ?? ':';

  return definePermissionInterpreter<
    Record<string, unknown>,
    ResourcesShape,
    Subject,
    Context
  >({
    name: 'scoped-permissions',
    interpret(input) {
      const flat = nested ? flattenNestedScopes(input, [], separator) : input;

      if (!isFlatScopedShape(flat)) {
        throw new Error(
          nested
            ? 'scopedPermissions({ nested: true }) could not interpret the input as a nested scope tree'
            : 'scopedPermissions() expects flat scope keys mapping to role definitions',
        );
      }

      return flat as PermissionsShape<ResourcesShape, Subject, Context>;
    },
  });
}

function isFlatScopedShape(
  value: Record<string, unknown>,
): value is Record<string, Record<string, unknown>> {
  return Object.values(value).every(isRoleMap);
}
