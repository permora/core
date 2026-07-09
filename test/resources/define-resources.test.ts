import { describe, expect, it } from 'vitest';
import { defineResource, defineResources } from '../../src/resources';

type Project = { id: string; ownerId: string };

describe('defineResources', () => {
  it('returns the definition unchanged', () => {
    const definition = {
      project: defineResource<Project>().actions(['create', 'read']),
    };

    const resources = defineResources(definition);

    expect(resources).toBe(definition);
    expect(resources.project.actions).toEqual(['create', 'read']);
  });

  it('supports multiple resources', () => {
    const resources = defineResources({
      project: defineResource<Project>().actions(['read']),
      invoice: defineResource<{ id: string }>().actions(['read', 'approve']),
    });

    expect(Object.keys(resources)).toEqual(['project', 'invoice']);
  });
});

describe('defineResource', () => {
  it('declares actions and phantom instance type', () => {
    const project = defineResource<Project>().actions(['read', 'update']);

    expect(project.actions).toEqual(['read', 'update']);
    expect(project.resource).toBeUndefined();
  });
});
