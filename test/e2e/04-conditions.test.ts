/**
 * E2E mirror of examples/04-conditions.md
 */
import { describe, expect, it } from 'vitest';
import { expectCanMatrix } from './helpers/assert-matrix';
import {
  conditionSubject,
  editorAuthz,
  largeInvoice,
  otherPost,
  ownPost,
  smallInvoice,
  tenantAuthz,
} from './fixtures/04-conditions';

describe('e2e / 04 conditions', () => {
  const session = editorAuthz.session({
    subject: conditionSubject,
    roles: ['editor'],
  });

  it('evaluates conditional grants with resource instances', () => {
    expectCanMatrix(session, [
      { resource: 'post', action: 'read', expected: true },
      {
        resource: 'post',
        action: 'delete',
        expected: true,
        resourceInstance: ownPost,
      },
      {
        resource: 'post',
        action: 'delete',
        expected: false,
        resourceInstance: otherPost,
      },
    ]);
  });

  it('explains denial when condition fails', () => {
    const explanation = session.explain('post', 'delete', otherPost);

    expect(explanation).toMatchObject({
      allowed: false,
      reason: 'ALL_CONDITIONS_FAILED',
      grantedBy: undefined,
      evaluatedGrants: [
        {
          sourceScope: '*',
          sourceRole: 'editor',
          action: 'delete',
          conditional: true,
          matched: false,
        },
      ],
    });
  });

  it('evaluates scoped tenant conditions', () => {
    const acme = tenantAuthz.session({
      subject: conditionSubject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    expect(acme.can('invoice', 'approve', smallInvoice)).toBe(true);
    expect(acme.can('invoice', 'approve', largeInvoice)).toBe(false);
  });

  it('marks conditional permissions without executing when in permissionGraph', () => {
    const snapshot = session.permissionGraph();
    const deleteGrant = snapshot.resolvedRoles[0]?.permissions.find(
      (entry) => entry.action === 'delete',
    );

    expect(deleteGrant).toEqual({
      resource: 'post',
      action: 'delete',
      conditional: true,
    });
  });
});
