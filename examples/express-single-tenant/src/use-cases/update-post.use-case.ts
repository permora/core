import type { PostRepository } from '../repositories/post.repository.js';
import type { AppSession } from '../types/app-session.js';
import { PostNotFoundError } from './post-errors.js';

export function createUpdatePostUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    async execute(params: {
      authz: AppSession;
      postId: string;
      title: string;
    }) {
      const post = input.postRepository.findById(params.postId);
      if (post === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      await params.authz.assert('post', 'update', post);
      const updated = input.postRepository.updateTitle(
        params.postId,
        params.title,
      );

      if (updated === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      return { post: updated };
    },
  };
}
