import type { PostRepository } from '../repositories/post.repository.js';
import type { AppSession } from '../types/app-session.js';
import type { User } from '../types/user.js';

export function createCreatePostUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    async execute(params: { authz: AppSession; user: User; title: string }) {
      await params.authz.assert('post', 'create');

      const post = input.postRepository.create({
        authorId: params.user.id,
        title: params.title,
      });

      return { post };
    },
  };
}
