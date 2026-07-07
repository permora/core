import type { PostRepository } from '../repositories/post.repository.js';
import type { AppSession } from '../types/app-session.js';
import { PostNotFoundError } from './post-errors.js';

export function createExplainPostDeleteUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    async execute(params: { authz: AppSession; postId: string }) {
      const post = input.postRepository.findById(params.postId);
      if (post === undefined) {
        throw new PostNotFoundError(params.postId);
      }

      const explanation = await params.authz.explain('post', 'delete', post);
      return { explanation };
    },
  };
}
