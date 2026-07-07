import { AuthorizationError } from './authorization-error';

/**
 * Thrown by `createAuthorization()` when the permission definition
 * violates a statically verifiable invariant (unknown resource,
 * unknown action, invalid structure).
 */
export class InvalidPermissionDefinitionError extends AuthorizationError {
  readonly code = 'AUTHZ_INVALID_PERMISSION_DEFINITION';

  constructor(message: string) {
    super(message);
  }
}
