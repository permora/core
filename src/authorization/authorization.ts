import type { AuthorizationPlugin } from '../plugins/plugin.types';
import { runSessionCreateHooks } from '../plugins/run-plugins';
import type {
  PermissionsMeta,
  PermissionsShape,
} from '../permissions/permission.types';
import type { ResourcesShape } from '../resources/resource.types';
import { normalizeScopeResolution } from '../roles/normalize-scope-resolution';
import type {
  AnyPermissionsDefinition,
  ScopeResolutionOptions,
} from '../roles/role.types';
import { AuthorizationSession } from '../session/authorization-session';
import { compileSession } from '../session/compile-session';
import type { SessionInput } from '../session/session.types';

/**
 * Immutable authorization engine bound to a resources + permissions
 * definition. Sessions share references to the original definition;
 * nothing is copied.
 */
export class Authorization<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Meta extends PermissionsMeta<
    Resources,
    Subject,
    Context,
    'single-tenant' | 'scoped',
    PermissionsShape<Resources, Subject, Context>
  >,
> {
  private readonly resources: Resources;
  private readonly permissions: AnyPermissionsDefinition;
  private readonly plugins: readonly AuthorizationPlugin<Subject, Context>[];
  private readonly scopeResolution: Required<ScopeResolutionOptions>;

  constructor(
    resources: Resources,
    permissions: AnyPermissionsDefinition,
    plugins: readonly AuthorizationPlugin<Subject, Context>[] = [],
    scopeResolution?: ScopeResolutionOptions,
  ) {
    this.resources = resources;
    this.permissions = permissions;
    this.plugins = plugins;
    this.scopeResolution = normalizeScopeResolution(scopeResolution);
  }

  /**
   * Synchronously creates a partially compiled session for
   * subject + scope + roles + context. Scope defaults to `"*"`.
   */
  session(
    input: SessionInput<Meta, Subject, Context>,
  ): AuthorizationSession<Resources, Subject, Context> {
    const context = (input as { context?: Context }).context as Context;
    const data = compileSession(
      this.permissions,
      {
        subject: input.subject,
        scope: input.scope,
        roles: input.roles,
        context,
      },
      this.scopeResolution,
    );

    const session = new AuthorizationSession<Resources, Subject, Context>(
      this.resources,
      data,
      this.plugins,
    );

    runSessionCreateHooks(this.plugins, {
      subject: input.subject,
      scope: data.scope,
      roles: input.roles,
      context,
    });

    return session;
  }
}
