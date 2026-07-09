import { PortableSessionError } from './portable-session-error';

/**
 * Thrown when a portable session payload is malformed or uses an
 * unsupported schema version.
 */
export class PortableSessionInvalidError extends PortableSessionError {
  readonly code = 'AUTHZ_PORTABLE_SESSION_INVALID';

  constructor(message: string) {
    super(message);
  }
}
