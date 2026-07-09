import { createAuthorization, definePermissions } from '../../../src/index';
import { scopedPermissions } from '../../../src/scoped';
import { testResources } from '../../fixtures/resources';
import type { User } from './shared-types';

export const portablePermissions = definePermissions({
  resources: testResources,
})
  .forSubject<User, Record<string, never>>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      editor: {
        extends: ['viewer'],
        project: ['update', { action: 'delete', condition: 'owner-only' }],
      },
    },
    'org:acme': {
      manager: {
        extends: ['editor'],
        invoice: ['read', { action: 'approve', condition: 'within-limit' }],
      },
    },
  });

export const portableAuthz = createAuthorization({
  resources: testResources,
  permissions: portablePermissions,
});

export const inlineWhenPermissions = definePermissions({
  resources: testResources,
})
  .forSubject<User, Record<string, never>>()
  .from({
    editor: {
      project: [
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.ownerId === subject.id,
        },
      ],
    },
  });

export const inlineWhenAuthz = createAuthorization({
  resources: testResources,
  permissions: inlineWhenPermissions,
});

export const portableSubject: User = {
  id: 'user_123',
  approvalLimit: 10_000,
};

export const portableProject = { id: 'p1', ownerId: 'user_123' };
export const portableInvoice = { id: 'i1', amount: 5_000 };
export const expensiveInvoice = { id: 'i2', amount: 50_000 };
