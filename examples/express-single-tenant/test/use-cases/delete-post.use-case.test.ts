import { describe, expect, it } from 'vitest';
import { createInMemoryPostRepository } from '../../src/repositories/post.repository.js';
import { createDeletePostUseCase } from '../../src/use-cases/delete-post.use-case.js';
import { PostNotFoundError } from '../../src/use-cases/post-errors.js';

describe('delete post use case', () => {
  it('removes a post by id', () => {
    const postRepository = createInMemoryPostRepository([
      { id: 'p1', authorId: 'u1', title: 'A', published: false },
    ]);
    const useCase = createDeletePostUseCase({ postRepository });

    const result = useCase.execute({ postId: 'p1' });

    expect(result.deleted.id).toBe('p1');
    expect(postRepository.findById('p1')).toBeUndefined();
  });

  it('throws PostNotFoundError when post does not exist', () => {
    const postRepository = createInMemoryPostRepository([]);
    const useCase = createDeletePostUseCase({ postRepository });

    expect(() => useCase.execute({ postId: 'missing' })).toThrow(
      PostNotFoundError,
    );
  });
});
