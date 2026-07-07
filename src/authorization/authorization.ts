import type { AuthorizationPlugin } from '../plugins/plugin.types';
import { runSessionCreateHooks } from '../plugins/run-plugins';
import type { ResourcesShape } from '../resources/resource.types';
import type { AnyPermissionsDefinition } from '../roles/role.types';
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
  Defs,
> {
  private readonly resources: Resources;
  private readonly permissions: AnyPermissionsDefinition;
  private readonly plugins: readonly AuthorizationPlugin<Subject, Context>[];

  constructor(
    resources: Resources,
    permissions: AnyPermissionsDefinition,
    plugins: readonly AuthorizationPlugin<Subject, Context>[] = [],
  ) {
    this.resources = resources;
    this.permissions = permissions;
    this.plugins = plugins;
  }

  /**
   * Synchronously creates a partially compiled session for
   * subject + scope + roles + context. Scope defaults to `"*"`.
   */
  session(
    input: SessionInput<Defs, Subject, Context>,
  ): AuthorizationSession<Resources, Subject, Context> {
    const context = (input as { context?: Context }).context as Context;
    const data = compileSession(this.permissions, {
      subject: input.subject,
      scope: input.scope,
      roles: input.roles,
      context,
    });

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
