import { lookupGrants } from '../grants/grant-index';
import type {
  EvaluationInput,
  EvaluationResult,
  GrantEvaluation,
} from './evaluator.types';

/**
 * Single evaluation path shared by `can()` and `explain()`.
 *
 * Candidates (exact grants + wildcard grants) are evaluated in order with
 * OR semantics and short-circuit: the first grant without a condition, or
 * whose condition returns true, allows the action. Default deny otherwise.
 *
 * Exceptions thrown by conditions propagate to the caller; they are never
 * silently converted into DENY.
 */
export async function evaluate(
  input: EvaluationInput,
): Promise<EvaluationResult> {
  const candidates = lookupGrants(input.grants, input.resource, input.action);

  if (candidates.length === 0) {
    return {
      allowed: false,
      evaluatedGrants: [],
      reason: 'NO_MATCHING_GRANT',
    };
  }

  const evaluatedGrants: GrantEvaluation[] = [];

  for (const grant of candidates) {
    if (grant.when === undefined) {
      evaluatedGrants.push({ grant, matched: true });
      return {
        allowed: true,
        evaluatedGrants,
        grantedBy: grant,
        reason: 'GRANT_MATCHED',
      };
    }

    const matched = await grant.when({
      subject: input.subject,
      scope: input.scope,
      resource: input.resourceInstance,
      context: input.context,
    });

    evaluatedGrants.push({ grant, matched });

    if (matched) {
      return {
        allowed: true,
        evaluatedGrants,
        grantedBy: grant,
        reason: 'CONDITION_MATCHED',
      };
    }
  }

  return {
    allowed: false,
    evaluatedGrants,
    reason: 'ALL_CONDITIONS_FAILED',
  };
}
