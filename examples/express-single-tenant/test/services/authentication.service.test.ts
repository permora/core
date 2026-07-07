import { describe, expect, it } from 'vitest';
import { authz } from '../../src/auth/authz.js';
import { createInMemoryUserRepository } from '../../src/repositories/user.repository.js';
import { createAuthenticationService } from '../../src/services/authentication.service.js';
import type { User } from '../../src/types/user.js';

const users: User[] = [{ id: 'u1', name: 'Alice', roles: ['viewer'] }];

const tokenService = {
  issueTokenForUserId: (userId: string) =>
    userId === 'u1' ? 'token-viewer' : undefined,
  resolveUserIdFromToken: (token: string) =>
    token === 'token-viewer' ? 'u1' : undefined,
};

describe('authentication service', () => {
  const userRepository = createInMemoryUserRepository(users);
  const service = createAuthenticationService({
    authz,
    userRepository,
    tokenService,
  });

  it('returns undefined when token is missing', () => {
    expect(
      service.authenticateFromBearerToken(undefined, 'req-1'),
    ).toBeUndefined();
  });

  it('returns undefined when token is invalid', () => {
    expect(
      service.authenticateFromBearerToken('Bearer nope', 'req-1'),
    ).toBeUndefined();
  });

  it('creates an authz session for a valid token', () => {
    const result = service.authenticateFromBearerToken(
      'Bearer token-viewer',
      'req-1',
    );

    expect(result?.user.id).toBe('u1');
    expect(result?.authz.scope).toBe('*');
    expect(result?.authz.roles).toEqual(['viewer']);
  });
});
