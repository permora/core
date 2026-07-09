import { PortableSessionError } from './portable-session-error';

export type PortableStaleReason =
  'unknown-resource' | 'unknown-action' | 'unknown-condition';

/**
 * Thrown when a portable session no longer matches the current resources
 * registry (e.g. after a deploy that removed a condition id).
 *
 * The consumer should regenerate the session from the authoritative source.
 */
export class PortableSessionStaleError extends PortableSessionError {
  readonly code = 'AUTHZ_PORTABLE_SESSION_STALE';

  constructor(
    message: string,
    readonly reason: PortableStaleReason,
    readonly details: Record<string, unknown>,
  ) {
    super(message);
  }
}
