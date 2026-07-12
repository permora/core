/**
 * End-to-end acceptance test covering the public API (runtime behavior).
 */
import { describe, expect, it } from 'vitest';
import {
  acceptanceInvoice,
  acceptanceProject,
  createAcceptanceSession,
} from './fixtures/acceptance';
import type { Invoice } from './fixtures/acceptance';

describe('acceptance', () => {
  const session = createAcceptanceSession();
  const project = acceptanceProject;
  const invoice = acceptanceInvoice;

  it('allows project read through transitive inheritance and scope fallback', () => {
    // manager → org:acme.editor → *.viewer
    expect(session.can('project', 'read')).toBe(true);
  });

  it('allows project delete through the org:acme editor override', () => {
    expect(session.can('project', 'delete', project)).toBe(true);
  });

  it('asserts invoice approval within the approval limit', () => {
    expect(session.assert('invoice', 'approve', invoice)).toBeUndefined();
  });

  it('explains the project delete decision', () => {
    const explanation = session.explain('project', 'delete', project);

    expect(explanation.allowed).toBe(true);
    expect(explanation.grantedBy).toEqual({
      sourceScope: 'org:acme',
      sourceRole: 'editor',
      action: 'delete',
    });
  });

  it('lists allowed project actions', () => {
    expect(session.allowedActions('project', project)).toEqual([
      'read',
      'update',
      'delete',
    ]);
  });

  it('denies invoice approval above the approval limit (default deny via conditions)', () => {
    const expensive: Invoice = { id: 'i2', amount: 50_000 };

    expect(session.can('invoice', 'approve', expensive)).toBe(false);
  });
});
