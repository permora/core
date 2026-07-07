import type { Request, Response } from 'express';
import { requireAuthenticatedRequest } from './helpers.js';

export function createGetMeController(input: {
  getMeUseCase: {
    execute(input: {
      user: NonNullable<Request['user']>;
      authz: NonNullable<Request['authz']>;
      requestId?: string;
    }): unknown;
  };
}) {
  return (req: Request, res: Response): void => {
    const auth = requireAuthenticatedRequest(req);
    res.json(
      input.getMeUseCase.execute({
        user: auth.user,
        authz: auth.authz,
        requestId: req.requestId,
      }),
    );
  };
}
