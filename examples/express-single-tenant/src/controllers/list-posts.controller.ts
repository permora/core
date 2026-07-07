import type { Request, Response } from 'express';
import { requireAuthenticatedRequest } from './helpers.js';

export function createListPostsController(input: {
  listPostsUseCase: {
    execute(authz: NonNullable<Request['authz']>): Promise<unknown>;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const result = await input.listPostsUseCase.execute(auth.authz);
    res.json(result);
  };
}
