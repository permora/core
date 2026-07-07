import type { PostRepository } from '../repositories/post.repository.js';
import type { Request, Response } from 'express';
import { PostNotFoundError } from '../use-cases/post-errors.js';
import {
  readRouteParam,
  readTitleFromBody,
  requireAuthenticatedRequest,
} from './helpers.js';

export function createUpdatePostController(input: {
  postRepository: PostRepository;
  updatePostUseCase: {
    execute(input: { postId: string; title: string }): unknown;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const postId = readRouteParam(req.params.id);
    const post = input.postRepository.findById(postId);

    if (post === undefined) {
      throw new PostNotFoundError(postId);
    }

    await auth.authz.assert('post', 'update', post);
    const result = input.updatePostUseCase.execute({
      postId,
      title: readTitleFromBody(req.body),
    });

    res.json(result);
  };
}
