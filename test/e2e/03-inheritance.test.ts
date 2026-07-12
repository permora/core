/**
 * E2E mirror of examples/03-inheritance.md
 */
import { describe, expect, it } from 'vitest';
import {
  CircularRoleInheritanceError,
  UnknownRoleError,
} from '../../src/errors';
import { expectCanMatrix } from './helpers/assert-matrix';
import {
  cycleAuthz,
  diamondAuthz,
  ghostAuthz,
  inheritanceAuthz,
  inheritanceSubject,
  multiParentAuthz,
  scopedOverrideAuthz,
} from './fixtures/03-inheritance';

describe('e2e / 03 inheritance', () => {
  const session = inheritanceAuthz.session({
    subject: inheritanceSubject,
    scope: 'org:acme',
    roles: ['manager'],
  });

  it('resolves transitive grants in DFS order', () => {
    expectCanMatrix(session, [
      { resource: 'project', action: 'read', expected: true },
      { resource: 'project', action: 'update', expected: true },
      { resource: 'project', action: 'delete', expected: true },
      { resource: 'invoice', action: 'approve', expected: true },
    ]);
  });

  it('exposes resolved roles in DFS order', () => {
    const tree = session.permissionGraph();

    expect(
      tree.resolvedRoles.map((role) => `${role.sourceScope}.${role.role}`),
    ).toEqual(['org:acme.manager', 'org:acme.editor', '*.viewer']);
  });

  it('collects multiple parents once', () => {
    const tree = multiParentAuthz
      .session({ subject: inheritanceSubject, roles: ['manager'] })
      .permissionGraph();

    expect(tree.resolvedRoles.map((role) => role.role).sort()).toEqual([
      'billing',
      'manager',
      'viewer',
    ]);
  });

  it('deduplicates diamond inheritance paths', () => {
    const tree = diamondAuthz
      .session({ subject: inheritanceSubject, roles: ['top'] })
      .permissionGraph();

    expect(
      tree.resolvedRoles.filter((role) => role.role === 'base'),
    ).toHaveLength(1);
  });

  it('throws CircularRoleInheritanceError', () => {
    expect(() =>
      cycleAuthz.session({ subject: inheritanceSubject, roles: ['admin'] }),
    ).toThrow(CircularRoleInheritanceError);
  });

  it('throws UnknownRoleError for unknown parent', () => {
    expect(() =>
      ghostAuthz.session({ subject: inheritanceSubject, roles: ['editor'] }),
    ).toThrow(UnknownRoleError);
  });

  it('does not inherit extends from * when scoped role replaces entirely', () => {
    const scoped = scopedOverrideAuthz.session({
      subject: inheritanceSubject,
      scope: 'org:acme',
      roles: ['editor'],
    });

    expectCanMatrix(scoped, [
      { resource: 'project', action: 'read', expected: true },
      { resource: 'project', action: 'update', expected: false },
    ]);

    expect(
      scoped.permissionGraph().resolvedRoles.map((role) => role.role),
    ).toEqual(['editor']);
  });
});
