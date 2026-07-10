/**
 * Shared acceptance fixture (resources + scoped permissions + session).
 * Used by acceptance.test.ts (runtime) and acceptance.test-d.ts (type safety).
 */
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../../src/index';
import { scopedPermissions } from '../../src/scoped';

export type User = { id: string; approvalLimit: number };
export type Project = { id: string; ownerId: string };
export type Invoice = { id: string; amount: number };

export const acceptanceResources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

export const acceptancePermissions = definePermissions({
  resources: acceptanceResources,
})
  .forSubject<User, Record<string, never>>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: {
        project: ['read'],
      },
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
              resource.amount <= subject.approvalLimit,
          },
        ],
      },
    },
  });

export const acceptanceAuthz = createAuthorization({
  resources: acceptanceResources,
  permissions: acceptancePermissions,
});

export const acceptanceSubject: User = {
  id: 'user_123',
  approvalLimit: 10_000,
};

export const acceptanceProject: Project = {
  id: 'p1',
  ownerId: 'user_123',
};

export const acceptanceInvoice: Invoice = {
  id: 'i1',
  amount: 5_000,
};

export function createAcceptanceSession() {
  return acceptanceAuthz.session({
    subject: acceptanceSubject,
    scope: 'org:acme',
    roles: ['manager'],
    context: {},
  });
}
