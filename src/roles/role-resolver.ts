import { DEFAULT_SCOPE } from '../permissions/constants';
import { mergeRoleDefinitions } from './merge-role-definitions';
import type {
  AnyPermissionsDefinition,
  ResolvedRole,
  ScopeResolutionOptions,
} from './role.types';
import { DEFAULT_SCOPE_RESOLUTION } from './role.types';

/**
 * Resolves a role for the given session scope.
 *
 * When `scope === "*"`, only the default-scope definition is used (flags are no-op).
 *
 * For non-default scopes, behavior depends on `options`:
 *
 * | `fallback` | `merge` | Result when both `scope.role` and `*.role` exist |
 * |:----------:|:-------:|--------------------------------------------------|
 * | `true`     | `false` | Specific replaces default entirely (normative default) |
 * | `true`     | `true`  | Merged definition |
 * | `false`    | `false` | Specific only |
 * | `false`    | `true`  | Merged definition |
 *
 * When only one side exists: specific wins if present; otherwise fallback to `*`
 * when `fallback` is `true`.
 */
export function resolveRole(
  permissions: AnyPermissionsDefinition,
  scope: string,
  role: string,
  options: Required<ScopeResolutionOptions> = DEFAULT_SCOPE_RESOLUTION,
): ResolvedRole | undefined {
  if (scope === DEFAULT_SCOPE) {
    const definition = permissions[DEFAULT_SCOPE]?.[role];
    if (definition === undefined) {
      return undefined;
    }

    return { sourceScope: DEFAULT_SCOPE, role, definition };
  }

  const specific = permissions[scope]?.[role];
  const fallback = permissions[DEFAULT_SCOPE]?.[role];

  if (specific !== undefined && fallback !== undefined && options.merge) {
    return {
      sourceScope: scope,
      role,
      definition: mergeRoleDefinitions(fallback, specific),
    };
  }

  if (specific !== undefined) {
    return { sourceScope: scope, role, definition: specific };
  }

  if (options.fallback && fallback !== undefined) {
    return { sourceScope: DEFAULT_SCOPE, role, definition: fallback };
  }

  return undefined;
}
