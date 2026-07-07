import type { TokenService } from '../services/authentication.service.js';

export function createTokenService(
  tokenByUserId: Record<string, string>,
): TokenService {
  const userIdByToken = Object.fromEntries(
    Object.entries(tokenByUserId).map(([userId, token]) => [token, userId]),
  ) as Record<string, string>;

  return {
    issueTokenForUserId(userId) {
      return tokenByUserId[userId];
    },
    resolveUserIdFromToken(token) {
      return userIdByToken[token];
    },
  };
}
