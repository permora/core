import type { EvaluationReason } from './evaluation-reason';

/**
 * Result of `session.explain()` and the `explanation` field on plugin end hooks.
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
