import type { AppAuthorization } from '../auth/authz.js';
import type { UserRepository } from '../repositories/user.repository.js';
import type { AppSession } from '../types/app-session.js';

export type TokenService = {
  resolveUserIdFromToken(token: string): string | undefined;
  issueTokenForUserId(userId: string): string | undefined;
};

export type AuthenticationResult = {
  user: AppSession['subject'];
  authz: AppSession;
};

export type AuthenticationService = {
  authenticateFromBearerToken(
    authorizationHeader: string | undefined,
    requestId: string,
  ): AuthenticationResult | undefined;
};

function readBearerToken(header: string | undefined): string | undefined {
  if (header === undefined) {
    return undefined;
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || token === undefined) {
    return undefined;
  }

  return token;
}

export function createAuthenticationService(input: {
  authz: AppAuthorization;
  userRepository: UserRepository;
  tokenService: TokenService;
}): AuthenticationService {
  return {
    authenticateFromBearerToken(authorizationHeader, requestId) {
      const token = readBearerToken(authorizationHeader);
      if (token === undefined) {
        return undefined;
      }

      const userId = input.tokenService.resolveUserIdFromToken(token);
      if (userId === undefined) {
        return undefined;
      }

      const user = input.userRepository.findById(userId);
      if (user === undefined) {
        return undefined;
      }

      return {
        user,
        authz: input.authz.session({
          subject: user,
          roles: user.roles,
          context: { requestId },
        }),
      };
    },
  };
}
