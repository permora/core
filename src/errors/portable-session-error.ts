import { AuthorizationError } from './authorization-error';

/**
 * Base class for errors related to portable session export/rehydration.
 */
export abstract class PortableSessionError extends AuthorizationError {}
