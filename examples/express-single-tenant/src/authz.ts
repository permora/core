import {
  createAuthorization,
  definePermissions,
  defineResources,
} from '@permora/core';
import type { AuthContext, Post, User } from './types.js';

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
