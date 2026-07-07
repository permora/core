import type { AuthenticationService } from '../services/authentication.service.js';
import type { NextFunction, Request, Response } from 'express';

export function createAuthenticateMiddleware(input: {
  authenticationService: AuthenticationService;
}) {
  return function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    req.requestId = req.header('x-request-id') ?? crypto.randomUUID();

    const result = input.authenticationService.authenticateFromBearerToken(
      req.header('authorization'),
      req.requestId,
    );

    if (result !== undefined) {
      req.user = result.user;
      req.authz = result.authz;
    }

    next();
  };
}
