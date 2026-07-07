import type { AuthorizationSession } from '@permora/core';
import type { AuthContext } from './auth-context.js';
import type { Post } from './post.js';
import type { User } from './user.js';

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
