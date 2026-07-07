import { describe, expect, it, vi } from 'vitest';
import { createInMemoryPostRepository } from '../../src/repositories/post.repository.js';
import { createExplainPostDeleteUseCase } from '../../src/use-cases/explain-post-delete.use-case.js';
import type { AppSession } from '../../src/types/app-session.js';

const explanation = {
  allowed: false,
  scope: '*',
  roles: ['editor'],
  resource: 'post',
  action: 'delete',
  evaluatedGrants: [],
  reason: 'NO_MATCHING_GRANT',
} as const;

describe('explain post delete use case', () => {
  it('returns the session explanation payload', async () => {
    const postRepository = createInMemoryPostRepository([
      { id: 'p1', authorId: 'u1', title: 'A', published: false },
    ]);
    const useCase = createExplainPostDeleteUseCase({ postRepository });
    const authz = {
      explain: vi.fn(async () => explanation),
    } as Pick<AppSession, 'explain'> as AppSession;

    const result = await useCase.execute({ authz, postId: 'p1' });

    expect(result.explanation).toBe(explanation);
    expect(authz.explain).toHaveBeenCalledWith('post', 'delete', {
      id: 'p1',
      authorId: 'u1',
      title: 'A',
      published: false,
    });
  });
});
