import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../../../src/index';
import type { Project, User } from './shared-types';

export const wildcardResources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
});

export const wildcardPermissions = definePermissions({
  resources: wildcardResources,
})
  .forSubject<User>()
  .from({
    viewer: { project: ['read'] },
    admin: { project: ['*'] },
  });

export const wildcardAuthz = createAuthorization({
  resources: wildcardResources,
  permissions: wildcardPermissions,
});

export const wildcardSubject: User = { id: 'user_123' };
export const foreignProject = { id: 'p2', ownerId: 'someone_else' };
