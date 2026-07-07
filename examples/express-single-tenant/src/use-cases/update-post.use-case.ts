import type { PostRepository } from '../repositories/post.repository.js';
import { PostNotFoundError } from './post-errors.js';

export function createUpdatePostUseCase(input: { postRepository: PostRepository }) {
  return {
    execute(params: { postId: string; title: string }) {
      const updated = input.postRepository.updateTitle(params.postId, params.title);

      if (updated === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      return { post: updated };
    },
  };
}
