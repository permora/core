import type { PostRepository } from '../repositories/post.repository.js';
import type { Request, Response } from 'express';
import { PostNotFoundError } from '../use-cases/post-errors.js';
import { readRouteParam, requireAuthenticatedRequest } from './helpers.js';

export function createExplainPostDeleteController(input: {
  postRepository: PostRepository;
  explainPostDeleteUseCase: {
    execute(explanation: Awaited<ReturnType<NonNullable<Request['authz']>['explain']>>): unknown;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const postId = readRouteParam(req.params.id);
    const post = input.postRepository.findById(postId);

    if (post === undefined) {
      throw new PostNotFoundError(postId);
    }

    const explanation = await auth.authz.explain('post', 'delete', post);
    const result = input.explainPostDeleteUseCase.execute(explanation);

    res.json(result);
  };
}
