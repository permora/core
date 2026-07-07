/**
 * Runtime-level condition signature. The public API preserves precise
 * generics; compiled grants only need the structural shape.
 */
export type AnyCondition = (input: {
  subject: unknown;
  scope: string;
  resource: unknown;
  context: unknown;
}) => boolean | Promise<boolean>;

/**
 * Normalized internal representation of a permission.
 */
export type CompiledGrant = {
  /** Scope where the owning role definition was found (e.g. `*`). */
  readonly sourceScope: string;
  /** Role name that contributed this grant (e.g. `viewer`). */
  readonly sourceRole: string;
  readonly resource: string;
  /** Concrete action or `"*"` (wildcards are never expanded). */
  readonly action: string;
  readonly when?: AnyCondition;
};

/**
 * Local per-session index: resource → action → candidate grants.
 * Lookup of candidates is O(1).
 */
export type GrantIndex = ReadonlyMap<
  string,
  ReadonlyMap<string, readonly CompiledGrant[]>
>;
