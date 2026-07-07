import type { PostRepository } from '../repositories/post.repository.js';
import { PostNotFoundError } from './post-errors.js';

export function createPublishPostUseCase(input: { postRepository: PostRepository }) {
  return {
    execute(params: { postId: string }) {
      const published = input.postRepository.publish(params.postId);

      if (published === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      return { post: published };
    },
  };
}
