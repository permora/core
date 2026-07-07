/**
 * Base class for all errors thrown by the authorization engine.
 */
export abstract class AuthorizationError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
