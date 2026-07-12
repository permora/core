/**
 * E2E mirror of examples/06-explain-and-permission-graph.md
 */
import { describe, expect, it } from 'vitest';
import {
  foreignProject,
  saasSubject,
  scopedSaasAuthz,
} from './fixtures/01-saas';

describe('e2e / 06 explain and permission graph', () => {
  const largeInvoice = { id: 'i2', amount: 50_000 };

  const session = scopedSaasAuthz.session({
    subject: saasSubject,
    scope: 'org:acme',
    roles: ['manager'],
    context: {},
  });

  it('returns compile snapshot without evaluating when', () => {
    const tree = session.permissionGraph();

    expect(tree.scope).toBe('org:acme');
    expect(tree.roles).toEqual(['manager']);
    expect(
      tree.resolvedRoles.map((role) => `${role.sourceScope}.${role.role}`),
    ).toEqual(['org:acme.manager', 'org:acme.editor', '*.viewer']);

    const manager = tree.resolvedRoles[0];
    expect(manager?.permissions).toEqual(
      expect.arrayContaining([
        { resource: 'invoice', action: 'read', conditional: false },
        { resource: 'invoice', action: 'approve', conditional: true },
      ]),
    );

    const editor = tree.resolvedRoles[1];
    expect(editor?.permissions).toEqual(
      expect.arrayContaining([
        { resource: 'project', action: 'read', conditional: false },
        { resource: 'project', action: 'update', conditional: false },
        { resource: 'project', action: 'delete', conditional: false },
      ]),
    );
  });

  it('explains unconditional grant match', () => {
    const explanation = session.explain('project', 'delete', foreignProject);

    expect(explanation).toMatchObject({
      allowed: true,
      grantedBy: {
        sourceScope: 'org:acme',
        sourceRole: 'editor',
        action: 'delete',
      },
      reason: 'GRANT_MATCHED',
    });
  });

  it('explains conditional denial', () => {
    const explanation = session.explain('invoice', 'approve', largeInvoice);

    expect(explanation.allowed).toBe(false);
    expect(explanation.reason).toBe('ALL_CONDITIONS_FAILED');
  });

  it('filters allowedActions after condition evaluation', () => {
    expect(session.allowedActions('project', foreignProject)).toEqual([
      'read',
      'update',
      'delete',
    ]);

    expect(session.allowedActions('invoice', largeInvoice)).toEqual(['read']);
  });
});
