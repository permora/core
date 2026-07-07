import type { EvaluationReason } from '../evaluator/evaluator.types';

/**
 * Snapshot passed to `onSessionCreate` after a session is compiled.
 * Intentionally not the `AuthorizationSession` instance to avoid
 * circular dependencies and keep the hook side-effect only.
 */
export type SessionCreateContext<Subject, Context> = {
  readonly subject: Subject;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly context: Context;
};

/**
 * Base context shared by all evaluation hooks.
 */
export type EvaluationContext<Subject, Context> = {
  readonly subject: Subject;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly context: Context;
  readonly resource: string;
  readonly action: string;
  readonly resourceInstance: unknown;
};

export type EvaluationStartContext<Subject, Context> = EvaluationContext<
  Subject,
  Context
>;

export type GrantEvaluationContext<Subject, Context> = EvaluationContext<
  Subject,
  Context
> & {
  readonly grant: {
    readonly sourceScope: string;
    readonly sourceRole: string;
    readonly action: string;
  };
  readonly conditional: boolean;
  readonly matched: boolean;
};

export type EvaluatedGrantSnapshot = {
  readonly sourceScope: string;
  readonly sourceRole: string;
  readonly action: string;
  readonly conditional: boolean;
  readonly matched: boolean;
};

export type EvaluationEndContext<Subject, Context> = EvaluationContext<
  Subject,
  Context
> & {
  readonly allowed: boolean;
  readonly reason: EvaluationReason;
  readonly evaluatedGrants: readonly EvaluatedGrantSnapshot[];
  readonly grantedBy?: {
    readonly sourceScope: string;
    readonly sourceRole: string;
    readonly action: string;
  };
};

export type GrantedContext<Subject, Context> = EvaluationEndContext<
  Subject,
  Context
> & {
  readonly allowed: true;
  readonly grantedBy: {
    readonly sourceScope: string;
    readonly sourceRole: string;
    readonly action: string;
  };
};

export type DeniedContext<Subject, Context> = EvaluationEndContext<
  Subject,
  Context
> & {
  readonly allowed: false;
};

export type PluginHook =
  | 'onSessionCreate'
  | 'onEvaluationStart'
  | 'onGrantEvaluation'
  | 'onEvaluationEnd'
  | 'onGranted'
  | 'onDenied';

/**
 * Observer plugin registered on the authorization engine.
 * Hooks never alter ALLOW/DENY decisions.
 */
export type AuthorizationPlugin<Subject = unknown, Context = unknown> = {
  readonly name?: string;
  readonly onSessionCreate?: (
    context: SessionCreateContext<Subject, Context>,
  ) => void | Promise<void>;
  readonly onEvaluationStart?: (
    context: EvaluationStartContext<Subject, Context>,
  ) => void | Promise<void>;
  readonly onGrantEvaluation?: (
    context: GrantEvaluationContext<Subject, Context>,
  ) => void | Promise<void>;
  readonly onEvaluationEnd?: (
    context: EvaluationEndContext<Subject, Context>,
  ) => void | Promise<void>;
  readonly onGranted?: (
    context: GrantedContext<Subject, Context>,
  ) => void | Promise<void>;
  readonly onDenied?: (
    context: DeniedContext<Subject, Context>,
  ) => void | Promise<void>;
};
