import { createGrantIndex } from '../grants/grant-index';
import type { GrantIndex } from '../grants/grant.types';
import { DEFAULT_SCOPE } from '../permissions/constants';
import { collectRoleGraph } from '../roles/inheritance-resolver';
import type {
  AnyPermissionsDefinition,
  ScopeResolutionOptions,
} from '../roles/role.types';
import { DEFAULT_SCOPE_RESOLUTION } from '../roles/role.types';

export type CompiledSessionData = {
  readonly subject: unknown;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly context: unknown;
  readonly grants: GrantIndex;
};

export type RawSessionInput = {
  readonly subject: unknown;
  readonly scope?: string;
  readonly roles: readonly string[];
  readonly context?: unknown;
};

/**
 * Partially compiles a session: resolves only the input roles and the
 * roles reachable through inheritance, normalizes their permissions into
 * grants and builds the local grant index.
 *
 * Synchronous by design; no conditions are executed and no wildcard is
 * expanded here. Complexity is O(R + P) for reachable roles/permissions,
 * independent of the total definition size.
 */
export function compileSession(
  permissions: AnyPermissionsDefinition,
  input: RawSessionInput,
  scopeResolution: Required<ScopeResolutionOptions> = DEFAULT_SCOPE_RESOLUTION,
): CompiledSessionData {
  const scope = input.scope ?? DEFAULT_SCOPE;

  const resolvedRoles = collectRoleGraph(
    permissions,
    scope,
    input.roles,
    scopeResolution,
  );

  return {
    subject: input.subject,
    scope,
    roles: input.roles,
    context: input.context,
    grants: createGrantIndex(resolvedRoles),
  };
}
