import {
  createAuthorization,
  definePermissions,
  defineResources,
} from '@permora/core';
import type { AuthContext } from '../types/auth-context.js';
import type { Post } from '../types/post.js';
import type { User } from '../types/user.js';

export const resources = defineResources({
  post: {
    actions: ['read', 'create', 'update', 'delete', 'publish'],
    resource: {} as Post,
  },
});

export const permissions = definePermissions<User, AuthContext>()(resources, {
  '*': {
    viewer: {
      post: ['read'],
    },
    editor: {
      extends: ['viewer'],
      post: [
        'create',
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.authorId === subject.id,
        },
      ],
    },
    admin: {
      post: ['*'],
    },
  },
});

export const authz = createAuthorization({
  resources,
  permissions,
});

export type AppAuthorization = typeof authz;
