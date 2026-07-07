import type { User } from '../types/user.js';

export type UserRepository = {
  findById(userId: string): User | undefined;
};

export function createInMemoryUserRepository(
  seedUsers: readonly User[],
): UserRepository {
  const users = [...seedUsers];

  return {
    findById(userId) {
      return users.find((user) => user.id === userId);
    },
  };
}
