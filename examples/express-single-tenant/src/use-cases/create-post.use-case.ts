import type { PostRepository } from '../repositories/post.repository.js';
import type { User } from '../types/user.js';

export function createCreatePostUseCase(input: { postRepository: PostRepository }) {
  return {
    execute(params: { user: User; title: string }) {
      const post = input.postRepository.create({
        authorId: params.user.id,
        title: params.title,
      });

      return { post };
    },
  };
}
