import type { CompiledGrant, GrantIndex } from '../grants/grant.types';

export type EvaluationInput = {
  readonly grants: GrantIndex;
  readonly subject: unknown;
  readonly scope: string;
  readonly context: unknown;
  readonly resource: string;
  readonly action: string;
  readonly resourceInstance: unknown;
};

export type GrantEvaluation = {
  readonly grant: CompiledGrant;
  readonly matched: boolean;
};

export type EvaluationReason =
  | 'GRANT_MATCHED'
  | 'CONDITION_MATCHED'
  | 'NO_MATCHING_GRANT'
  | 'ALL_CONDITIONS_FAILED';

export type EvaluationResult = {
  readonly allowed: boolean;
  readonly evaluatedGrants: readonly GrantEvaluation[];
  readonly grantedBy?: CompiledGrant;
  readonly reason: EvaluationReason;
};
