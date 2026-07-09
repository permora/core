import { describe, expect, it } from 'vitest';
import { compileRoleGrants } from '../../src/grants';
import { testResources } from '../fixtures/resources';

describe('compileRoleGrants', () => {
  it('normalizes string permissions into grants', () => {
    const grants = compileRoleGrants({
      sourceScope: '*',
      role: 'viewer',
      definition: { project: ['read'] },
    });

    expect(grants).toEqual([
      {
        sourceScope: '*',
        sourceRole: 'viewer',
        resource: 'project',
        action: 'read',
      },
    ]);
  });

  it('normalizes conditional permissions preserving when', () => {
    const when = () => true;

    const grants = compileRoleGrants({
      sourceScope: 'org:acme',
      role: 'editor',
      definition: { project: [{ action: 'delete', when }] },
    });

    expect(grants).toEqual([
      {
        sourceScope: 'org:acme',
        sourceRole: 'editor',
        resource: 'project',
        action: 'delete',
        when,
      },
    ]);
  });

  it('keeps wildcard as "*" without expansion', () => {
    const grants = compileRoleGrants({
      sourceScope: '*',
      role: 'admin',
      definition: { project: ['*'] },
    });

    expect(grants).toEqual([
      {
        sourceScope: '*',
        sourceRole: 'admin',
        resource: 'project',
        action: '*',
      },
    ]);
  });

  it('skips the extends field', () => {
    const grants = compileRoleGrants({
      sourceScope: '*',
      role: 'editor',
      definition: { extends: ['viewer'], project: ['update'] },
    });

    expect(grants).toHaveLength(1);
    expect(grants[0]?.resource).toBe('project');
  });

  it('compiles multiple resources', () => {
    const grants = compileRoleGrants({
      sourceScope: '*',
      role: 'manager',
      definition: { project: ['read'], invoice: ['read', 'approve'] },
    });

    expect(grants).toHaveLength(3);
  });

  it('resolves named condition ids into when functions', () => {
    const grants = compileRoleGrants(
      {
        sourceScope: '*',
        role: 'editor',
        definition: {
          project: [{ action: 'delete', condition: 'owner-only' }],
        },
      },
      testResources,
    );

    expect(grants[0]).toMatchObject({
      resource: 'project',
      action: 'delete',
      conditionId: 'owner-only',
    });
    expect(typeof grants[0]?.when).toBe('function');
  });
});
