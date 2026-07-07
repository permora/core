import type { PostRepository } from '../repositories/post.repository.js';
import type { AppSession } from '../types/app-session.js';
import { PostNotFoundError } from './post-errors.js';

export function createPublishPostUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    async execute(params: { authz: AppSession; postId: string }) {
      const post = input.postRepository.findById(params.postId);
      if (post === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      await params.authz.assert('post', 'publish', post);
      const published = input.postRepository.publish(params.postId);

      if (published === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      return { post: published };
    },
  };
}
