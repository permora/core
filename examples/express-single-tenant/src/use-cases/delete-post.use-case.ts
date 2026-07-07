import type { PostRepository } from '../repositories/post.repository.js';
import { PostNotFoundError } from './post-errors.js';

export function createDeletePostUseCase(input: { postRepository: PostRepository }) {
  return {
    execute(params: { postId: string }) {
      const deleted = input.postRepository.delete(params.postId);

      if (deleted === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      return { deleted };
    },
  };
}
