import { AuthorizationDeniedError } from '../errors/authorization-denied-error';
import { evaluate } from '../evaluator/evaluator';
import type { EvaluationResult } from '../evaluator/evaluator.types';
import type { GrantIndex } from '../grants/grant.types';
import type { AuthorizationPlugin } from '../plugins/plugin.types';
import { serializePortableSession } from '../portable/serialize-portable-session';
import type { PortableSession } from '../portable/portable.types';
import type { ResolvedRole } from '../roles/role.types';
import type {
  ActionOf,
  InstanceOf,
  ResourceName,
  ResourcesShape,
} from '../resources/resource.types';
import type { CompiledSessionData } from './compile-session';
import { serializePermissionGraph } from './serialize-permission-graph';
import type {
  AuthorizationExplanation,
  SessionPermissionGraph,
} from './session.types';

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
  private readonly resolvedRoles: readonly ResolvedRole[];
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
    this.resolvedRoles = data.resolvedRoles;
    this.plugins = plugins;
  }

  private evaluateAction(
    resource: string,
    action: string,
    resourceInstance: unknown,
  ): EvaluationResult {
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
   * Returns true when any reachable grant allows the action
   * (default deny).
   */
  can<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): boolean {
    const result = this.evaluateAction(resource, action, resourceInstance);
    return result.allowed;
  }

  /**
   * Semantic negation of `can()`.
   */
  cannot<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): boolean {
    return !this.can(resource, action, resourceInstance);
  }

  /**
   * Throws `AuthorizationDeniedError` when denied.
   */
  assert<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): void {
    if (this.can(resource, action, resourceInstance)) {
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
  explain<Name extends ResourceName<Resources>>(
    resource: Name,
    action: ActionOf<Resources, Name>,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): AuthorizationExplanation {
    const result = this.evaluateAction(resource, action, resourceInstance);

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
  allowedActions<Name extends ResourceName<Resources>>(
    resource: Name,
    resourceInstance?: InstanceOf<Resources, Name>,
  ): ActionOf<Resources, Name>[] {
    const declaredActions = this.resources[resource]
      .actions as readonly ActionOf<Resources, Name>[];

    const allowed: ActionOf<Resources, Name>[] = [];

    for (const action of declaredActions) {
      const result = this.evaluateAction(resource, action, resourceInstance);
      if (result.allowed) {
        allowed.push(action);
      }
    }

    return allowed;
  }

  /**
   * Returns the reachable role graph and normalized permissions for this
   * session. Synchronous; does not evaluate conditions or expand wildcards.
   *
   * Roles appear in depth-first inheritance order (same as compilation).
   * Use `explain()` / `allowedActions()` for effective access decisions.
   */
  permissionGraph(): SessionPermissionGraph {
    return serializePermissionGraph({
      scope: this.scope,
      roles: this.roles,
      resolvedRoles: this.resolvedRoles,
      resources: this.resources,
    });
  }

  /**
   * Exports a JSON-friendly portable snapshot of this session.
   *
   * Conditional grants must use named `condition` ids from
   * `defineResource(...).actions(..., { conditions })`. Inline `when` functions are not
   * serializable and cause `PortableInlineConditionError`.
   *
   * Transport integrity and expiration (e.g. JWT `exp`) are the consumer's
   * responsibility — not handled by the core.
   */
  toPortable(): PortableSession<Subject> {
    return serializePortableSession({
      scope: this.scope,
      roles: this.roles,
      subject: this.subject,
      grants: this.grants,
    });
  }
}
