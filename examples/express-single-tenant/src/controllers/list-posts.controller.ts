import type { Request, Response } from 'express';
import { requireAuthenticatedRequest } from './helpers.js';

export function createListPostsController(input: {
  listPostsUseCase: { execute(): unknown };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    await auth.authz.assert('post', 'read');
    const result = input.listPostsUseCase.execute();
    res.json(result);
  };
}
