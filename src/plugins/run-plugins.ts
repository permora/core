import type { GrantEvaluation } from '../evaluator/evaluator.types';
import type { EvaluationReason } from '../evaluator/evaluator.types';
import type { CompiledGrant } from '../grants/grant.types';
import type {
  AuthorizationPlugin,
  DeniedContext,
  EvaluationEndContext,
  EvaluatedGrantSnapshot,
  GrantedContext,
  GrantEvaluationContext,
  PluginHook,
  SessionCreateContext,
} from './plugin.types';

type EvaluationHookInput = {
  readonly subject: unknown;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly context: unknown;
  readonly resource: string;
  readonly action: string;
  readonly resourceInstance: unknown;
};

/**
 * Runs a single hook across all registered plugins sequentially.
 * No-op when `plugins` is empty or undefined (zero overhead path).
 */
export function runPluginHook<Subject, Context>(
  plugins: readonly AuthorizationPlugin<Subject, Context>[] | undefined,
  hook: PluginHook,
  context: unknown,
): void {
  if (plugins === undefined || plugins.length === 0) {
    return;
  }

  for (const plugin of plugins) {
    const handler = plugin[hook];
    if (handler !== undefined) {
      handler(context as never);
    }
  }
}

/**
 * Runs `onSessionCreate` synchronously for all registered plugins.
 */
export function runSessionCreateHooks<Subject, Context>(
  plugins: readonly AuthorizationPlugin<Subject, Context>[] | undefined,
  context: SessionCreateContext<Subject, Context>,
): void {
  if (plugins === undefined || plugins.length === 0) {
    return;
  }

  for (const plugin of plugins) {
    const handler = plugin.onSessionCreate;
    if (handler !== undefined) {
      handler(context);
    }
  }
}

function buildEvaluationContext(
  input: EvaluationHookInput,
): EvaluationHookInput {
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

function toGrantSnapshot(evaluation: GrantEvaluation): EvaluatedGrantSnapshot {
  return {
    sourceScope: evaluation.grant.sourceScope,
    sourceRole: evaluation.grant.sourceRole,
    action: evaluation.grant.action,
    conditional: evaluation.grant.when !== undefined,
    matched: evaluation.matched,
  };
}

function toGrantedBy(grant: CompiledGrant) {
  return {
    sourceScope: grant.sourceScope,
    sourceRole: grant.sourceRole,
    action: grant.action,
  };
}

/**
 * Notifies evaluation end hooks: `onEvaluationEnd`, then `onGranted` or
 * `onDenied` based on the result.
 */
export function notifyEvaluationEnd<Subject, Context>(
  plugins: readonly AuthorizationPlugin<Subject, Context>[] | undefined,
  input: EvaluationHookInput,
  result: {
    readonly allowed: boolean;
    readonly reason: EvaluationReason;
    readonly evaluatedGrants: readonly GrantEvaluation[];
    readonly grantedBy?: CompiledGrant;
  },
): void {
  if (plugins === undefined || plugins.length === 0) {
    return;
  }

  const base = buildEvaluationContext(input);
  const evaluatedGrants = result.evaluatedGrants.map(toGrantSnapshot);
  const grantedBy = result.grantedBy
    ? toGrantedBy(result.grantedBy)
    : undefined;

  const endContext: EvaluationEndContext<Subject, Context> = {
    ...base,
    allowed: result.allowed,
    reason: result.reason,
    evaluatedGrants,
    grantedBy,
  } as EvaluationEndContext<Subject, Context>;

  runPluginHook(plugins, 'onEvaluationEnd', endContext);

  if (result.allowed && grantedBy !== undefined) {
    const grantedContext: GrantedContext<Subject, Context> = {
      ...endContext,
      allowed: true,
      grantedBy,
    } as GrantedContext<Subject, Context>;

    runPluginHook(plugins, 'onGranted', grantedContext);
    return;
  }

  if (!result.allowed) {
    const deniedContext: DeniedContext<Subject, Context> = {
      ...endContext,
      allowed: false,
    } as DeniedContext<Subject, Context>;

    runPluginHook(plugins, 'onDenied', deniedContext);
  }
}

/**
 * Notifies `onGrantEvaluation` after a single grant is evaluated.
 */
export function notifyGrantEvaluation<Subject, Context>(
  plugins: readonly AuthorizationPlugin<Subject, Context>[] | undefined,
  input: EvaluationHookInput,
  grant: CompiledGrant,
  matched: boolean,
): void {
  if (plugins === undefined || plugins.length === 0) {
    return;
  }

  const context: GrantEvaluationContext<Subject, Context> = {
    ...buildEvaluationContext(input),
    grant: {
      sourceScope: grant.sourceScope,
      sourceRole: grant.sourceRole,
      action: grant.action,
    },
    conditional: grant.when !== undefined,
    matched,
  } as GrantEvaluationContext<Subject, Context>;

  runPluginHook(plugins, 'onGrantEvaluation', context);
}
