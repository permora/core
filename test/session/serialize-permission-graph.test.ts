import { describe, expect, it, vi } from 'vitest';
import { compileSession } from '../../src/session/compile-session';
import { serializePermissionGraph } from '../../src/session/serialize-permission-graph';
import { testResources } from '../fixtures/resources';

describe('serializePermissionGraph', () => {
  it('serializes roles in depth-first inheritance order', () => {
    const permissions = {
      '*': {
        viewer: { project: ['read'] },
        editor: { extends: ['viewer'], project: ['update'] },
      },
      'org:acme': {
        editor: { extends: ['viewer'], project: ['update'] },
        manager: { extends: ['editor'], invoice: ['read'] },
      },
    };

    const compiled = compileSession(
      permissions,
      {
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['manager'],
      },
      testResources,
    );

    const snapshot = serializePermissionGraph(compiled);

    expect(snapshot.scope).toBe('org:acme');
    expect(snapshot.roles).toEqual(['manager']);
    expect(
      snapshot.resolvedRoles.map((r) => `${r.sourceScope}.${r.role}`),
    ).toEqual(['org:acme.manager', 'org:acme.editor', '*.viewer']);
  });

  it('includes extends when declared', () => {
    const compiled = compileSession(
      {
        '*': {
          editor: { extends: ['viewer'], project: ['update'] },
          viewer: { project: ['read'] },
        },
      },
      { subject: {}, roles: ['editor'] },
      testResources,
    );

    const snapshot = serializePermissionGraph(compiled);

    expect(snapshot.resolvedRoles[0]?.extends).toEqual(['viewer']);
    expect(snapshot.resolvedRoles[1]?.extends).toBeUndefined();
  });

  it('marks conditional permissions without executing when', () => {
    const when = vi.fn(() => true);

    const compiled = compileSession(
      {
        '*': {
          editor: {
            project: [{ action: 'delete', when }],
          },
        },
      },
      { subject: {}, roles: ['editor'] },
      testResources,
    );

    const snapshot = serializePermissionGraph(compiled);

    expect(snapshot.resolvedRoles[0]?.permissions).toEqual([
      { resource: 'project', action: 'delete', conditional: true },
    ]);
    expect(when).not.toHaveBeenCalled();
  });

  it('keeps wildcard actions without expansion', () => {
    const compiled = compileSession(
      { '*': { admin: { project: ['*'] } } },
      { subject: {}, roles: ['admin'] },
      testResources,
    );

    const snapshot = serializePermissionGraph(compiled);

    expect(snapshot.resolvedRoles[0]?.permissions).toEqual([
      { resource: 'project', action: '*', conditional: false },
    ]);
  });

  it('omits extends when not declared', () => {
    const compiled = compileSession(
      { '*': { viewer: { project: ['read'] } } },
      { subject: {}, roles: ['viewer'] },
      testResources,
    );

    const snapshot = serializePermissionGraph(compiled);

    expect(snapshot.resolvedRoles[0]).not.toHaveProperty('extends');
  });
});
