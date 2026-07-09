import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../../../src/index';
import type { Post, User } from './shared-types';

export const blogResources = defineResources({
  post: defineResource<Post>().actions([
    'read',
    'create',
    'update',
    'delete',
    'publish',
  ]),
});

export const blogPermissions = definePermissions({ resources: blogResources })
  .forSubject<User>()
  .from({
    viewer: {
      post: ['read'],
    },
    editor: {
      extends: ['viewer'],
      post: ['create', 'update'],
    },
  });

export const blogAuthz = createAuthorization({
  resources: blogResources,
  permissions: blogPermissions,
});

export const blogSubject: User = { id: 'u2' };
