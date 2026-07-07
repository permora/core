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
 * Union of scope names declared in a permission definition. Any string is
 * still accepted (scopes can be dynamic); declared scopes get autocomplete.
 */
export type ScopeNameOf<Defs> = (keyof Defs & string) | (string & {});

/**
 * Union of role names declared in any scope of a permission definition.
 * Any string is still accepted (unknown roles fail at runtime with
 * `UnknownRoleError`); declared roles get autocomplete.
 */
export type RoleNameOf<Defs> =
  | { [Scope in keyof Defs & string]: keyof Defs[Scope] & string }[keyof Defs &
      string]
  | (string & {});

/**
 * Input of `authz.session()`. `context` is required when the `Context`
 * type parameter does not accept `undefined`.
 */
export type SessionInput<Defs, Subject, Context> = {
  readonly subject: Subject;
  readonly scope?: ScopeNameOf<Defs>;
  readonly roles: readonly RoleNameOf<Defs>[];
} & (undefined extends Context
  ? { readonly context?: Context }
  : { readonly context: Context });
