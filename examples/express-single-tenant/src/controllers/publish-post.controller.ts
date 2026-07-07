import type { Request, Response } from 'express';
import { readRouteParam, requireAuthenticatedRequest } from './helpers.js';

export function createPublishPostController(input: {
  publishPostUseCase: {
    execute(input: {
      authz: NonNullable<Request['authz']>;
      postId: string;
    }): Promise<unknown>;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const result = await input.publishPostUseCase.execute({
      authz: auth.authz,
      postId: readRouteParam(req.params.id),
    });

    res.json(result);
  };
}
