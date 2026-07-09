import { defineResource, defineResources } from '../../../src/resources';
import type { Invoice, Project } from './shared-types';

export const saasResources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});
