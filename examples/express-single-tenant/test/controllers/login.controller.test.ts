import { describe, expect, it, vi } from 'vitest';
import { createLoginController } from '../../src/controllers/login.controller.js';
import { UserNotFoundError } from '../../src/use-cases/login.use-case.js';

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

describe('login controller', () => {
  it('returns the login payload on success', () => {
    const controller = createLoginController({
      loginUseCase: {
        execute: vi.fn(() => ({ token: 'token-viewer', user: { id: 'u1' } })),
      },
    });
    const res = createResponseDouble();

    controller({ body: { userId: 'u1' } } as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ token: 'token-viewer', user: { id: 'u1' } });
  });

  it('maps UserNotFoundError to HTTP 404', () => {
    const controller = createLoginController({
      loginUseCase: {
        execute: vi.fn(() => {
          throw new UserNotFoundError('ghost');
        }),
      },
    });
    const res = createResponseDouble();

    controller({ body: { userId: 'ghost' } } as never, res as never);

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: 'USER_NOT_FOUND',
      message: 'Unknown user "ghost".',
    });
  });
});
