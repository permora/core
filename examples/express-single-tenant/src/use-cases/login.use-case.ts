import type { UserRepository } from '../repositories/user.repository.js';
import type { TokenService } from '../services/authentication.service.js';

export class UserNotFoundError extends Error {
  constructor(userId: string) {
    super(`Unknown user "${userId}".`);
    this.name = 'UserNotFoundError';
  }
}

export function createLoginUseCase(input: {
  tokenService: TokenService;
  userRepository: UserRepository;
}) {
  return {
    execute(userId: string) {
      const user = input.userRepository.findById(userId);
      if (user === undefined) {
        throw new UserNotFoundError(userId);
      }

      const token = input.tokenService.issueTokenForUserId(user.id);
      if (token === undefined) {
        throw new Error(`No token configured for user "${user.id}".`);
      }

      return { token, user };
    },
  };
}
