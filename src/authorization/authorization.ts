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

  constructor(resources: Resources, permissions: AnyPermissionsDefinition) {
    this.resources = resources;
    this.permissions = permissions;
  }

  /**
   * Synchronously creates a partially compiled session for
   * subject + scope + roles + context. Scope defaults to `"*"`.
   */
  session(
    input: SessionInput<Defs, Subject, Context>,
  ): AuthorizationSession<Resources, Subject, Context> {
    const data = compileSession(this.permissions, {
      subject: input.subject,
      scope: input.scope,
      roles: input.roles,
      context: (input as { context?: Context }).context,
    });

    return new AuthorizationSession<Resources, Subject, Context>(
      this.resources,
      data,
    );
  }
}
