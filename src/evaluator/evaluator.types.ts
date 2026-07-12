import type { CompiledGrant, GrantIndex } from '../grants/grant.types';
import type { AuthorizationPlugin } from '../plugins/plugin.types';
import type { EvaluationSource } from './evaluation-source';
import type { EvaluationReason } from './evaluation-reason';

export type { EvaluationReason } from './evaluation-reason';
export type { EvaluationSource } from './evaluation-source';

export type EvaluationInput = {
  readonly grants: GrantIndex;
  readonly subject: unknown;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly context: unknown;
  readonly resource: string;
  readonly action: string;
  readonly resourceInstance: unknown;
  readonly source?: EvaluationSource;
  readonly plugins?: readonly AuthorizationPlugin[];
};

export type GrantEvaluation = {
  readonly grant: CompiledGrant;
  readonly matched: boolean;
};

export type EvaluationResult = {
  readonly allowed: boolean;
  readonly evaluatedGrants: readonly GrantEvaluation[];
  readonly grantedBy?: CompiledGrant;
  readonly reason: EvaluationReason;
};
