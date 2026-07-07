import { AuthorizationError } from './authorization-error';

/**
 * Thrown by `session.assert()` when the action is denied.
 *
 * Deliberately does not carry the resource instance, which may
 * contain sensitive data.
 */
export class AuthorizationDeniedError extends AuthorizationError {
  readonly code = 'AUTHZ_DENIED';

  readonly subject: unknown;
  readonly scope: string;
  readonly roles: readonly string[];
  readonly resource: string;
  readonly action: string;

  constructor(input: {
    subject: unknown;
    scope: string;
    roles: readonly string[];
    resource: string;
    action: string;
  }) {
    super(
      `Denied: action "${input.action}" on resource "${input.resource}" in scope "${input.scope}" (roles: ${input.roles.join(', ')})`,
    );
    this.subject = input.subject;
    this.scope = input.scope;
    this.roles = input.roles;
    this.resource = input.resource;
    this.action = input.action;
  }
}
