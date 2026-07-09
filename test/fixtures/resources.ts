import { defineResource, defineResources } from '../../src/resources';

export const testResources = defineResources({
  project: defineResource<{ ownerId?: string }>().actions(
    ['read', 'update', 'delete', '*'],
    {
      conditions: {
        'owner-only': ({ subject, resource }) =>
          resource.ownerId === (subject as { id: string }).id,
      },
    },
  ),
  invoice: defineResource<{ amount?: number }>().actions(['read', 'approve'], {
    conditions: {
      'within-limit': ({ subject, resource }) =>
        (resource.amount ?? 0) <=
        ((subject as { approvalLimit?: number }).approvalLimit ?? 0),
    },
  }),
  ticket: defineResource().actions(['read']),
});
