import { lookupGrants } from '../grants/grant-index';
import {
  notifyEvaluationEnd,
  notifyGrantEvaluation,
  runPluginHook,
} from '../plugins/run-plugins';
import type {
  EvaluationInput,
  EvaluationResult,
  GrantEvaluation,
} from './evaluator.types';

function evaluationHookInput(input: EvaluationInput) {
  return {
    subject: input.subject,
    scope: input.scope,
    roles: input.roles,
    context: input.context,
    resource: input.resource,
    action: input.action,
    resourceInstance: input.resourceInstance,
  };
}

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
export function evaluate(input: EvaluationInput): EvaluationResult {
  const hookInput = evaluationHookInput(input);
  const plugins = input.plugins;

  runPluginHook(plugins, 'onEvaluationStart', hookInput);

  const candidates = lookupGrants(input.grants, input.resource, input.action);

  if (candidates.length === 0) {
    const result: EvaluationResult = {
      allowed: false,
      evaluatedGrants: [],
      reason: 'NO_MATCHING_GRANT',
    };

    notifyEvaluationEnd(plugins, hookInput, result);
    return result;
  }

  const evaluatedGrants: GrantEvaluation[] = [];

  for (const grant of candidates) {
    if (grant.when === undefined) {
      evaluatedGrants.push({ grant, matched: true });
      notifyGrantEvaluation(plugins, hookInput, grant, true);

      const result: EvaluationResult = {
        allowed: true,
        evaluatedGrants,
        grantedBy: grant,
        reason: 'GRANT_MATCHED',
      };

      notifyEvaluationEnd(plugins, hookInput, result);
      return result;
    }

    const matched = grant.when({
      subject: input.subject,
      scope: input.scope,
      resource: input.resourceInstance,
      context: input.context,
    });

    evaluatedGrants.push({ grant, matched });
    notifyGrantEvaluation(plugins, hookInput, grant, matched);

    if (matched) {
      const result: EvaluationResult = {
        allowed: true,
        evaluatedGrants,
        grantedBy: grant,
        reason: 'CONDITION_MATCHED',
      };

      notifyEvaluationEnd(plugins, hookInput, result);
      return result;
    }
  }

  const result: EvaluationResult = {
    allowed: false,
    evaluatedGrants,
    reason: 'ALL_CONDITIONS_FAILED',
  };

  notifyEvaluationEnd(plugins, hookInput, result);
  return result;
}
