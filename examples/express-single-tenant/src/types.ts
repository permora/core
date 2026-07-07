import type { AuthorizationSession } from '@permora/core';

export type Role = 'viewer' | 'editor' | 'admin';

export type User = {
  id: string;
  name: string;
  roles: Role[];
};

export type Post = {
  id: string;
  authorId: string;
  title: string;
  published: boolean;
};

export type AuthContext = {
  requestId: string;
};

export type AppSession = AuthorizationSession<
  {
    post: {
      actions: readonly ['read', 'create', 'update', 'delete', 'publish'];
      resource: Post;
    };
  },
  User,
  AuthContext
>;

declare global {
  namespace Express {
    interface Request {
      user?: User;
      authz?: AppSession;
      requestId?: string;
    }
  }
}

export {};
