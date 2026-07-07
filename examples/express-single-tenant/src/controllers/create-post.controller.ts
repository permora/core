import type { Request, Response } from 'express';
import { readTitleFromBody, requireAuthenticatedRequest } from './helpers.js';

export function createCreatePostController(input: {
  createPostUseCase: {
    execute(input: {
      authz: NonNullable<Request['authz']>;
      user: NonNullable<Request['user']>;
      title: string;
    }): Promise<unknown>;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const result = await input.createPostUseCase.execute({
      authz: auth.authz,
      user: auth.user,
      title: readTitleFromBody(req.body),
    });

    res.status(201).json(result);
  };
}
