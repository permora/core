import { AuthorizationDeniedError } from '@permora/core';
import { describe, expect, it, vi } from 'vitest';
import { createInMemoryPostRepository } from '../../src/repositories/post.repository.js';
import { createDeletePostUseCase } from '../../src/use-cases/delete-post.use-case.js';
import { PostNotFoundError } from '../../src/use-cases/post-errors.js';

function makeAuthz(assertImpl?: () => Promise<void>) {
  return {
    assert: assertImpl ?? vi.fn(async () => undefined),
  } as never;
}

describe('delete post use case', () => {
  it('removes a post when authorized', async () => {
    const postRepository = createInMemoryPostRepository([
      { id: 'p1', authorId: 'u1', title: 'A', published: false },
    ]);
    const useCase = createDeletePostUseCase({ postRepository });

    const result = await useCase.execute({ authz: makeAuthz(), postId: 'p1' });

    expect(result.deleted.id).toBe('p1');
    expect(postRepository.findById('p1')).toBeUndefined();
  });

  it('propagates AuthorizationDeniedError', async () => {
    const postRepository = createInMemoryPostRepository([
      { id: 'p1', authorId: 'u1', title: 'A', published: false },
    ]);
    const useCase = createDeletePostUseCase({ postRepository });
    const denied = new AuthorizationDeniedError({
      subject: { id: 'u2' },
      scope: '*',
      roles: ['viewer'],
      resource: 'post',
      action: 'delete',
    });

    await expect(
      useCase.execute({
        authz: makeAuthz(async () => {
          throw denied;
        }),
        postId: 'p1',
      }),
    ).rejects.toBe(denied);
  });

  it('throws PostNotFoundError when post does not exist', async () => {
    const postRepository = createInMemoryPostRepository([]);
    const useCase = createDeletePostUseCase({ postRepository });

    await expect(
      useCase.execute({ authz: makeAuthz(), postId: 'missing' }),
    ).rejects.toBeInstanceOf(PostNotFoundError);
  });
});
