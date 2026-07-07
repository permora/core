import type { PostRepository } from '../repositories/post.repository.js';
import type { AppSession } from '../types/app-session.js';
import { PostNotFoundError } from './post-errors.js';

export function createDeletePostUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    async execute(params: { authz: AppSession; postId: string }) {
      const post = input.postRepository.findById(params.postId);
      if (post === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      await params.authz.assert('post', 'delete', post);
      const deleted = input.postRepository.delete(params.postId);

      if (deleted === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      return { deleted };
    },
  };
}
