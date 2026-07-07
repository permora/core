import type { Request, Response } from 'express';
import { readTitleFromBody, requireAuthenticatedRequest } from './helpers.js';

export function createCreatePostController(input: {
  createPostUseCase: {
    execute(input: {
      user: NonNullable<Request['user']>;
      title: string;
    }): unknown;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    await auth.authz.assert('post', 'create');
    const result = input.createPostUseCase.execute({
      user: auth.user,
      title: readTitleFromBody(req.body),
    });

    res.status(201).json(result);
  };
}
