import { AuthorizationError } from './authorization-error';

/**
 * Thrown when a role given to a session (or referenced via `extends`)
 * cannot be resolved in the target scope nor in the default scope.
 */
export class UnknownRoleError extends AuthorizationError {
  readonly code = 'AUTHZ_UNKNOWN_ROLE';

  readonly scope: string;
  readonly role: string;

  constructor(input: { scope: string; role: string }) {
    super(
      `Unknown role "${input.role}" in scope "${input.scope}" (no fallback found in default scope "*")`,
    );
    this.scope = input.scope;
    this.role = input.role;
  }
}
