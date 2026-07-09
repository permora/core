/** Supported portable session schema version. */
export const PORTABLE_SESSION_VERSION = 1 as const;

/**
 * A single grant inside a {@link PortableSession}.
 * Grants are the source of truth; roles are already flattened.
 */
export type PortableGrant = {
  readonly resource: string;
  readonly action: string;
  readonly sourceScope: string;
  readonly sourceRole: string;
  readonly condition?: string;
};

/**
 * JSON-friendly portable authorization snapshot.
 *
 * Does not include `context` (per-request) or temporal fields (`exp`/`iat`).
 * Transport integrity and expiration are the consumer's responsibility.
 */
export type PortableSession<Subject = unknown> = {
  readonly v: typeof PORTABLE_SESSION_VERSION;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly subject: Subject;
  readonly grants: readonly PortableGrant[];
};

/**
 * Compact wire representation using a string dictionary and numeric indices.
 *
 * Tuple shape: `[v, scopeIdx, roleIdxs, subject, dict, grantTuples]`
 * where each grant tuple is `[resourceIdx, actionIdx, sourceScopeIdx, sourceRoleIdx, conditionIdx?]`.
 */
export type CompactPortableSession = readonly [
  typeof PORTABLE_SESSION_VERSION,
  number,
  readonly number[],
  unknown,
  readonly string[],
  readonly (readonly number[])[],
];
