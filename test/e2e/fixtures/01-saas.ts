import { createAuthorization, definePermissions } from '../../../src/index';
import { scopedPermissions } from '../../../src/scoped';
import type { User } from './shared-types';
import { saasResources } from './saas-resources';

export const scopedSaasPermissions = definePermissions({
  resources: saasResources,
})
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      editor: {
        extends: ['viewer'],
        project: [
          'update',
          {
            action: 'delete',
            when: ({ subject, resource }) => resource.ownerId === subject.id,
          },
        ],
      },
    },
    'org:acme': {
      editor: {
        extends: ['viewer'],
        project: ['read', 'update', 'delete'],
      },
      manager: {
        extends: ['editor'],
        invoice: [
          'read',
          {
            action: 'approve',
            when: ({ subject, resource }) =>
              resource.amount <= (subject.approvalLimit ?? 0),
          },
        ],
      },
    },
  });

export const scopedSaasAuthz = createAuthorization({
  resources: saasResources,
  permissions: scopedSaasPermissions,
});

export const saasSubject: User = { id: 'user_123', approvalLimit: 10_000 };

export const foreignProject = { id: 'p2', ownerId: 'someone_else' };
