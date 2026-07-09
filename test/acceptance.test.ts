/**
 * End-to-end acceptance test reproducing the SPEC §41 scenario through
 * the public API only (runtime behavior).
 */
import { describe, expect, it } from 'vitest';
import {
  acceptanceInvoice,
  acceptanceProject,
  createAcceptanceSession,
} from './fixtures/acceptance';
import type { Invoice } from './fixtures/acceptance';

describe('SPEC §41 acceptance', () => {
  const session = createAcceptanceSession();
  const project = acceptanceProject;
  const invoice = acceptanceInvoice;

  it('allows project read through transitive inheritance and scope fallback', async () => {
    // manager → org:acme.editor → *.viewer
    await expect(session.can('project', 'read')).resolves.toBe(true);
  });

  it('allows project delete through the org:acme editor override', async () => {
    await expect(session.can('project', 'delete', project)).resolves.toBe(true);
  });

  it('asserts invoice approval within the approval limit', async () => {
    await expect(
      session.assert('invoice', 'approve', invoice),
    ).resolves.toBeUndefined();
  });

  it('explains the project delete decision', async () => {
    const explanation = await session.explain('project', 'delete', project);

    expect(explanation.allowed).toBe(true);
    expect(explanation.grantedBy).toEqual({
      sourceScope: 'org:acme',
      sourceRole: 'editor',
      action: 'delete',
    });
  });

  it('lists allowed project actions', async () => {
    await expect(session.allowedActions('project', project)).resolves.toEqual([
      'read',
      'update',
      'delete',
    ]);
  });

  it('denies invoice approval above the approval limit (default deny via conditions)', async () => {
    const expensive: Invoice = { id: 'i2', amount: 50_000 };

    await expect(session.can('invoice', 'approve', expensive)).resolves.toBe(
      false,
    );
  });
});
