import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../../../src/index';
import { scopedPermissions } from '../../../src/scoped';
import type { Invoice, User } from './shared-types';

export const nestedResources = defineResources({
  invoice: defineResource<Invoice>().actions(['read', 'create', 'approve']),
});

export const flatPermissions = definePermissions({ resources: nestedResources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    'org:acme': { admin: { invoice: ['read'] } },
  });

export const nestedPermissions = definePermissions({
  resources: nestedResources,
})
  .forSubject<User>()
  .with(scopedPermissions({ nested: true }))
  .from({
    '*': { viewer: { invoice: ['read'] } },
    arasaka: {
      staging: {
        admin: { invoice: ['create', 'read'] },
      },
    },
  });

export const customSeparatorPermissions = definePermissions({
  resources: nestedResources,
})
  .forSubject<User>()
  .with(scopedPermissions({ nested: true, separator: '__' }))
  .from({
    arasaka: {
      staging: { admin: { invoice: ['read'] } },
    },
  });

export const flatAuthz = createAuthorization({
  resources: nestedResources,
  permissions: flatPermissions,
});

export const nestedAuthz = createAuthorization({
  resources: nestedResources,
  permissions: nestedPermissions,
});

export const customSeparatorAuthz = createAuthorization({
  resources: nestedResources,
  permissions: customSeparatorPermissions,
});

export const nestedSubject: User = { id: 'u1' };
