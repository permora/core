import type { Request, Response } from 'express';
import {
  readRouteParam,
  readTitleFromBody,
  requireAuthenticatedRequest,
} from './helpers.js';

export function createUpdatePostController(input: {
  updatePostUseCase: {
    execute(input: {
      authz: NonNullable<Request['authz']>;
      postId: string;
      title: string;
    }): Promise<unknown>;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const result = await input.updatePostUseCase.execute({
      authz: auth.authz,
      postId: readRouteParam(req.params.id),
      title: readTitleFromBody(req.body),
    });

    res.json(result);
  };
}
