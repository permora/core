import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../../../src/index';
import { scopedPermissions } from '../../../src/scoped';
import type { Invoice, Post, User } from './shared-types';

export const conditionResources = defineResources({
  post: defineResource<Post>().actions([
    'read',
    'create',
    'update',
    'delete',
    'publish',
  ]),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

export const editorPermissions = definePermissions({
  resources: conditionResources,
})
  .forSubject<User>()
  .from({
    editor: {
      post: [
        'read',
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.authorId === subject.id,
        },
      ],
    },
  });

export const editorAuthz = createAuthorization({
  resources: conditionResources,
  permissions: editorPermissions,
});

export const tenantPermissions = definePermissions({
  resources: conditionResources,
})
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    'org:acme': {
      manager: {
        invoice: [
          'read',
          {
            action: 'approve',
            when: ({ subject, resource }) =>
              (resource.amount ?? 0) <= (subject.approvalLimit ?? 0),
          },
        ],
      },
    },
  });

export const tenantAuthz = createAuthorization({
  resources: conditionResources,
  permissions: tenantPermissions,
});

export const conditionSubject: User = { id: 'u2', approvalLimit: 10_000 };
export const ownPost: Post = { id: 'p1', authorId: 'u2', published: false };
export const otherPost: Post = { id: 'p2', authorId: 'u1', published: false };
export const smallInvoice: Invoice = { id: 'i1', amount: 500 };
export const largeInvoice: Invoice = { id: 'i2', amount: 50_000 };
