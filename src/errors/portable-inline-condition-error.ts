import { PortableSessionError } from './portable-session-error';

/**
 * Thrown by `session.toPortable()` when a conditional grant uses an inline
 * `when` function instead of a named `condition` id.
 */
export class PortableInlineConditionError extends PortableSessionError {
  readonly code = 'AUTHZ_PORTABLE_INLINE_CONDITION';

  constructor(
    message: string,
    readonly details: {
      readonly resource: string;
      readonly action: string;
      readonly sourceScope: string;
      readonly sourceRole: string;
    },
  ) {
    super(message);
  }
}
