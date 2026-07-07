import { describe, expect, it, vi } from 'vitest';
import { createCreatePostController } from '../../src/controllers/create-post.controller.js';
import type { AppSession } from '../../src/types/app-session.js';
import type { User } from '../../src/types/user.js';

function createResponseDouble() {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response;
}

describe('create post controller', () => {
  it('adapts request input and calls the use case', async () => {
    const execute = vi.fn(async () => ({ post: { id: 'p3' } }));
    const controller = createCreatePostController({
      createPostUseCase: { execute },
    });
    const res = createResponseDouble();
    const user: User = { id: 'u2', name: 'Bob', roles: ['editor'] };
    const authz = { scope: '*', roles: ['editor'] } as unknown as AppSession;
    const req = {
      body: { title: 'New title' },
      user,
      authz,
    };

    await controller(req as never, res as never);

    expect(execute).toHaveBeenCalledWith({
      authz,
      user,
      title: 'New title',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ post: { id: 'p3' } });
  });
});
