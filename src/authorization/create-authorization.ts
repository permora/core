import type {
  DefinedPermissions,
  PermissionsMeta,
  PermissionsMode,
  PermissionsShape,
} from '../permissions/permission.types';
import type { AuthorizationPlugin } from '../plugins/plugin.types';
import type { ResourcesShape } from '../resources/resource.types';
import { normalizeScopeResolution } from '../roles/normalize-scope-resolution';
import type {
  AnyPermissionsDefinition,
  ScopeResolutionOptions,
} from '../roles/role.types';
import { Authorization } from './authorization';
import { validateDefinition } from './validate-definition';

/**
 * Creates the authorization engine from a resources definition and a
 * permissions definition produced by `definePermissions()`.
 *
 * Eagerly validates cheap invariants (structure, known resources/actions,
 * wildcards); inheritance issues are detected lazily per session.
 *
 * @example
 * // Strict: roles must be defined in the session scope (no fallback to "*")
 * const authz = createAuthorization({
 *   resources,
 *   permissions,
 *   scopeResolution: { fallback: false },
 * });
 *
 * @example
 * // Merge: combine "*.role" with "scope.role" when both exist
 * const authz = createAuthorization({
 *   resources,
 *   permissions,
 *   scopeResolution: { merge: true },
 * });
 */
export function createAuthorization<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Defs extends PermissionsShape<Resources, Subject, Context>,
  Mode extends PermissionsMode,
>(input: {
  resources: Resources;
  permissions: DefinedPermissions<Resources, Subject, Context, Defs, Mode>;
  plugins?: readonly AuthorizationPlugin<Subject, Context>[];
  /**
   * Controls how roles are resolved for non-default session scopes.
   * Defaults to `{ fallback: true, merge: false }` (normative SPEC §8–9).
   */
  scopeResolution?: ScopeResolutionOptions;
}): Authorization<
  Resources,
  Subject,
  Context,
  PermissionsMeta<Resources, Subject, Context, Mode, Defs>
> {
  const permissions = input.permissions as AnyPermissionsDefinition;
  const scopeResolution = normalizeScopeResolution(input.scopeResolution);

  validateDefinition(input.resources, permissions);

  return new Authorization<
    Resources,
    Subject,
    Context,
    PermissionsMeta<Resources, Subject, Context, Mode, Defs>
  >(input.resources, permissions, input.plugins ?? [], scopeResolution);
}
