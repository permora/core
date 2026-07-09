import { createAuthorization, definePermissions } from '../../../src/index';
import { scopedPermissions } from '../../../src/scoped';
import type { User } from './shared-types';
import { saasResources } from './saas-resources';

export const mergePermissions = definePermissions({ resources: saasResources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      admin: {
        extends: ['viewer'],
        project: ['read', 'update'],
        invoice: ['read'],
      },
    },
    'org:acme': {
      admin: { invoice: ['approve'] },
    },
  });

export const strictMergePermissions = definePermissions({
  resources: saasResources,
})
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
      admin: { project: ['update'], invoice: ['read'] },
    },
    'org:acme': {
      admin: { invoice: ['approve'] },
    },
  });

export const defaultMergeAuthz = createAuthorization({
  resources: saasResources,
  permissions: mergePermissions,
});

export const mergeAuthz = createAuthorization({
  resources: saasResources,
  permissions: mergePermissions,
  scopeResolution: { merge: true },
});

export const strictAuthz = createAuthorization({
  resources: saasResources,
  permissions: mergePermissions,
  scopeResolution: { fallback: false },
});

export const strictMergeAuthz = createAuthorization({
  resources: saasResources,
  permissions: strictMergePermissions,
  scopeResolution: { fallback: false, merge: true },
});

export const mergeSubject: User = { id: 'u1' };
