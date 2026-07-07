import type { PostRepository } from '../repositories/post.repository.js';

export function createListPostsUseCase(input: {
  postRepository: PostRepository;
}) {
  return {
    execute() {
      return { posts: input.postRepository.findAll() };
    },
  };
}
