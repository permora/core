/**
 * Loosely typed views of the permission definition used by the runtime
 * engine. The public API keeps precise generic types; internals only need
 * the structural shape.
 */
export type AnyRoleDefinition = {
  readonly [resource: string]: unknown;
  readonly extends?: readonly string[];
};

export type AnyPermissionsDefinition = {
  readonly [scope: string]: {
    readonly [role: string]: AnyRoleDefinition;
  };
};

/**
 * Controls how roles are resolved when a session uses a non-default scope.
 *
 * Resolution modes (when `scope !== "*"`):
 *
 * | `fallback` | `merge` | Behavior |
 * |:----------:|:-------:|----------|
 * | `true`     | `false` | Default — per-role fallback; specific replaces `*` entirely |
 * | `true`     | `true`  | Fallback when absent; merge `*.role` + `scope.role` when both exist |
 * | `false`    | `false` | Strict — only roles defined in the session scope |
 * | `false`    | `true`  | No fallback; merge when both exist in the session scope |
 */
export type ScopeResolutionOptions = {
  /**
   * When `true` (default), roles missing in the session scope fall back to
   * `*.role`. When `false`, only definitions in the session scope are used.
   */
  readonly fallback?: boolean;

  /**
   * When `true`, combines `*.role` with `scope.role` if both exist.
   * When `false` (default), the specific-scope definition fully replaces
   * the default-scope definition.
   */
  readonly merge?: boolean;
};

/**
 * Default scope resolution — matches the normative behavior in SPEC §8–9.
 */
export const DEFAULT_SCOPE_RESOLUTION: Required<ScopeResolutionOptions> = {
  fallback: true,
  merge: false,
};

/**
 * A role resolved for a session, tracking the scope where its definition
 * was actually found (specific scope or the default scope fallback).
 */
export type ResolvedRole = {
  /** Scope where the definition was found (`*` when fallback applied). */
  readonly sourceScope: string;
  readonly role: string;
  readonly definition: AnyRoleDefinition;
};
