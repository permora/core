import { AuthorizationDeniedError } from '../errors/authorization-denied-error';
import { evaluate } from '../evaluator/evaluator';
import type { EvaluationResult } from '../evaluator/evaluator.types';
import type { GrantIndex } from '../grants/grant.types';
import type { AuthorizationPlugin } from '../plugins/plugin.types';
import type {
  ActionOf,
  InstanceOf,
  ResourceName,
  ResourcesShape,
} from '../resources/resource.types';
import type { CompiledSessionData } from './compile-session';
import type { AuthorizationExplanation } from './session.types';

/**
 * Runtime view of the authorization model for a specific
 * subject + scope + roles + context combination.
 *
 * Holds only the grants reachable from the session roles (partial
 * compilation); never a copy of the full definition.
 */
export class AuthorizationSession<
  Resources extends ResourcesShape,
  Subject,
  Context,
> {
  readonly subject: Subject;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly context: Context;

  private readonly grants: GrantIndex;
  private readonly resources: Resources;
  private readonly plugins: readonly AuthorizationPlugin<Subject, Context>[];

  constructor(
    resources: Resources,
    data: CompiledSessionData,
    plugins: readonly AuthorizationPlugin<Subject, Context>[] = [],
  ) {
    this.resources = resources;
    this.subject = data.subject as Subject;
    this.scope = data.scope;
    this.roles = data.roles;
    this.context = data.context as Context;
    this.grants = data.grants;
    this.plugins = plugins;
  }

  private evaluateAction(
    resource: string,
    action: string,
    resourceInstance: unknown,
  ): Promise<EvaluationResult> {
    return evaluate({
      grants: this.grants,
      subject: this.subject,
      scope: this.scope,
      roles: this.roles,
      context: this.context,
      resource,
      action,
      resourceInstance,
      plugins: this.plugins as readonly AuthorizationPlugin[],
    });
  }

  /**
   * Resolves to true when any reachable grant allows the action
   * (default deny).
   */
  async can<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): Promise<boolean> {
    const result = await this.evaluateAction(
      resource,
      action,
      resourceInstance,
    );
    return result.allowed;
  }

  /**
   * Semantic negation of `can()`.
   */
  async cannot<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): Promise<boolean> {
    return !(await this.can(resource, action, resourceInstance));
  }

  /**
   * Resolves when allowed; throws `AuthorizationDeniedError` when denied.
   */
  async assert<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): Promise<void> {
    if (await this.can(resource, action, resourceInstance)) {
      return;
    }

    throw new AuthorizationDeniedError({
      subject: this.subject,
      scope: this.scope,
      roles: this.roles,
      resource,
      action,
    });
  }

  /**
   * Explains the decision using the same evaluator as `can()`.
   */
  async explain<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): Promise<AuthorizationExplanation> {
    const result = await this.evaluateAction(
      resource,
      action,
      resourceInstance,
    );

    return {
      allowed: result.allowed,
      scope: this.scope,
      roles: this.roles,
      resource,
      action,
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

  /**
   * Returns the actions of the resource allowed for this session,
   * interpreting wildcards through the action list declared in
   * `defineResources()`. Conditions are evaluated when present.
   */
  async allowedActions<Name extends ResourceName<Resources>>(
    resource: Name,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): Promise<ActionOf<Resources, Name>[]> {
    const declaredActions = this.resources[resource]
      .actions as readonly ActionOf<Resources, Name>[];

    const allowed: ActionOf<Resources, Name>[] = [];

    for (const action of declaredActions) {
      const result = await this.evaluateAction(
        resource,
        action,
        resourceInstance,
      );
      if (result.allowed) {
        allowed.push(action);
      }
    }

    return allowed;
  }
}
