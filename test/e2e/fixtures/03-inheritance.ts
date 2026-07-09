import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../../../src/index';
import { scopedPermissions } from '../../../src/scoped';
import type { User } from './shared-types';
import { saasResources } from './saas-resources';

export const inheritancePermissions = definePermissions({
  resources: saasResources,
})
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      editor: { extends: ['viewer'], project: ['update'] },
      manager: { extends: ['editor'], invoice: ['read'] },
    },
    'org:acme': {
      manager: { extends: ['editor'], invoice: ['approve'] },
      editor: { extends: ['viewer'], project: ['read', 'update', 'delete'] },
    },
  });

export const inheritanceAuthz = createAuthorization({
  resources: saasResources,
  permissions: inheritancePermissions,
});

export const scopedOverridePermissions = definePermissions({
  resources: saasResources,
})
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      editor: {
        extends: ['viewer'],
        project: ['read', 'update'],
      },
    },
    'org:acme': {
      editor: { project: ['read'] },
    },
  });

export const scopedOverrideAuthz = createAuthorization({
  resources: saasResources,
  permissions: scopedOverridePermissions,
});

export const diamondResources = defineResources({
  asset: defineResource<{ id: string }>().actions(['read']),
});

export const diamondPermissions = definePermissions({
  resources: diamondResources,
})
  .forSubject<User>()
  .from({
    base: { asset: ['read'] },
    left: { extends: ['base'] },
    right: { extends: ['base'] },
    top: { extends: ['left', 'right'] },
  });

export const diamondAuthz = createAuthorization({
  resources: diamondResources,
  permissions: diamondPermissions,
});

export const multiParentResources = defineResources({
  note: defineResource<{ id: string }>().actions(['read']),
  bill: defineResource<{ id: string }>().actions(['read']),
});

export const multiParentPermissions = definePermissions({
  resources: multiParentResources,
})
  .forSubject<User>()
  .from({
    viewer: { note: ['read'] },
    billing: { bill: ['read'] },
    manager: { extends: ['viewer', 'billing'] },
  });

export const multiParentAuthz = createAuthorization({
  resources: multiParentResources,
  permissions: multiParentPermissions,
});

export const cyclePermissions = definePermissions({ resources: saasResources })
  .forSubject<User>()
  .from({
    admin: { extends: ['manager'] },
    manager: { extends: ['editor'] },
    editor: { extends: ['admin'] },
  });

export const cycleAuthz = createAuthorization({
  resources: saasResources,
  permissions: cyclePermissions,
});

export const ghostPermissions = definePermissions({ resources: saasResources })
  .forSubject<User>()
  .from({
    editor: { extends: ['ghost'] },
  });

export const ghostAuthz = createAuthorization({
  resources: saasResources,
  permissions: ghostPermissions,
});

export const inheritanceSubject: User = { id: 'u1' };
