import type { Post, User } from './types.js';

export const users: User[] = [
  { id: 'u1', name: 'Alice Viewer', roles: ['viewer'] },
  { id: 'u2', name: 'Bob Editor', roles: ['editor'] },
  { id: 'u3', name: 'Carol Admin', roles: ['admin'] },
];

export const tokensByUserId: Record<string, string> = {
  u1: 'token-viewer',
  u2: 'token-editor',
  u3: 'token-admin',
};

export const userIdByToken = Object.fromEntries(
  Object.entries(tokensByUserId).map(([userId, token]) => [token, userId]),
) as Record<string, string>;

export const posts: Post[] = [
  {
    id: 'p1',
    authorId: 'u2',
    title: 'Editor owned draft',
    published: false,
  },
  {
    id: 'p2',
    authorId: 'u1',
    title: 'Viewer owned post',
    published: true,
  },
];

export function findUserById(userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}

export function findUserByToken(token: string): User | undefined {
  const userId = userIdByToken[token];
  return userId ? findUserById(userId) : undefined;
}

export function findPostById(postId: string): Post | undefined {
  return posts.find((post) => post.id === postId);
}
