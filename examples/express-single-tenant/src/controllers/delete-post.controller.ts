import type { PostRepository } from '../repositories/post.repository.js';
import type { Request, Response } from 'express';
import { PostNotFoundError } from '../use-cases/post-errors.js';
import { readRouteParam, requireAuthenticatedRequest } from './helpers.js';

export function createDeletePostController(input: {
  postRepository: PostRepository;
  deletePostUseCase: {
    execute(input: { postId: string }): unknown;
  };
}) {
  return async (req: Request, res: Response): Promise<void> => {
    const auth = requireAuthenticatedRequest(req);
    const postId = readRouteParam(req.params.id);
    const post = input.postRepository.findById(postId);

    if (post === undefined) {
      throw new PostNotFoundError(postId);
    }

    await auth.authz.assert('post', 'delete', post);
    const result = input.deletePostUseCase.execute({ postId });

    res.json(result);
  };
}
