import type { AuthorizationExplanation } from './explanation.types';
import type { EvaluationResult } from './evaluator.types';

export function buildExplanation(
  input: {
    readonly scope: string;
    readonly roles: readonly string[];
    readonly resource: string;
    readonly action: string;
  },
  result: EvaluationResult,
): AuthorizationExplanation {
  return {
    allowed: result.allowed,
    scope: input.scope,
    roles: input.roles,
    resource: input.resource,
    action: input.action,
    evaluatedGrants: result.evaluatedGrants.map((evaluation) => ({
      sourceScope: evaluation.grant.sourceScope,
      sourceRole: evaluation.grant.sourceRole,
      action: evaluation.grant.action,
      conditional: evaluation.grant.when !== undefined,
      matched: evaluation.matched,
    })),
    grantedBy: result.grantedBy
      ? {
          sourceScope: result.grantedBy.sourceScope,
          sourceRole: result.grantedBy.sourceRole,
          action: result.grantedBy.action,
        }
      : undefined,
    reason: result.reason,
  };
}
