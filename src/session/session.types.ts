import type { DefaultScope } from '../permissions/constants';
import type { PermissionsMeta } from '../permissions/permission.types';
import type { EvaluationReason } from '../evaluator/evaluator.types';

/**
 * Result of `session.explain()`.
 */
export type AuthorizationExplanation = {
  readonly allowed: boolean;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly resource: string;
  readonly action: string;

  readonly evaluatedGrants: ReadonlyArray<{
    readonly sourceScope: string;
    readonly sourceRole: string;
    readonly action: string;
    readonly conditional: boolean;
    readonly matched: boolean;
  }>;

  readonly grantedBy?: {
    readonly sourceScope: string;
    readonly sourceRole: string;
    readonly action: string;
  };

  readonly reason: EvaluationReason;
};

/**
 * Union of scope names for session input. Single-tenant definitions only
 * need the default scope; scoped definitions expose declared scope keys.
 */
export type ScopeNameOf<Meta> = Meta extends {
  readonly mode: 'single-tenant';
}
  ? DefaultScope | (string & {})
  : Meta extends { readonly mode: 'scoped'; readonly defs: infer Defs }
    ? (keyof Defs & string) | (string & {})
    : string & {};

/**
 * Union of role names available for session input.
 */
export type RoleNameOf<Meta> = Meta extends {
  readonly mode: 'single-tenant';
  readonly defs: infer Defs;
}
  ? Defs extends { readonly '*': infer RoleMap }
    ? (keyof RoleMap & string) | (string & {})
    : string & {}
  : Meta extends { readonly mode: 'scoped'; readonly defs: infer Defs }
    ? Defs extends Record<string, Record<string, unknown>>
      ? | {
            [Scope in keyof Defs & string]: keyof Defs[Scope] & string;
          }[keyof Defs & string]
        | (string & {})
      : string & {}
    : string & {};

/**
 * Input of `authz.session()`. `context` is required when the `Context`
 * type parameter does not accept `undefined`.
 */
export type SessionInput<Meta, Subject, Context> = {
  readonly subject: Subject;
  readonly scope?: ScopeNameOf<Meta>;
  readonly roles: readonly RoleNameOf<Meta>[];
} & (undefined extends Context
  ? { readonly context?: Context }
  : { readonly context: Context });

export type { PermissionsMeta };
