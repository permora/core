import { describe, expect, it } from 'vitest';
import { defineResources } from '../../src/resources';

type Project = { id: string; ownerId: string };

describe('defineResources', () => {
  it('returns the definition unchanged', () => {
    const definition = {
      project: {
        actions: ['create', 'read'],
        resource: {} as Project,
      },
    };

    const resources = defineResources(definition);

    expect(resources).toBe(definition);
    expect(resources.project.actions).toEqual(['create', 'read']);
  });

  it('supports multiple resources', () => {
    const resources = defineResources({
      project: { actions: ['read'], resource: {} as Project },
      invoice: { actions: ['read', 'approve'], resource: {} },
    });

    expect(Object.keys(resources)).toEqual(['project', 'invoice']);
  });
});
