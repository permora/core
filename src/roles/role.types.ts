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
 * A role resolved for a session, tracking the scope where its definition
 * was actually found (specific scope or the default scope fallback).
 */
export type ResolvedRole = {
  /** Scope where the definition was found (`*` when fallback applied). */
  readonly sourceScope: string;
  readonly role: string;
  readonly definition: AnyRoleDefinition;
};
