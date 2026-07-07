import type { AppSession } from '../types/app-session.js';
import type { PostRepository } from '../repositories/post.repository.js';

export function createListPostsUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    async execute(authz: AppSession) {
      await authz.assert('post', 'read');
      return { posts: input.postRepository.findAll() };
    },
  };
}
