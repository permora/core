/**
 * E2E mirror of examples/01-scoped.md
 */
import { describe, expect, it } from 'vitest';
import { expectCanMatrix } from './helpers/assert-matrix';
import {
  foreignProject,
  saasSubject,
  scopedSaasAuthz,
} from './fixtures/01-saas';

describe('e2e / 01 scoped', () => {
  const defaultEditor = scopedSaasAuthz.session({
    subject: saasSubject,
    roles: ['editor'],
  });

  const acmeEditor = scopedSaasAuthz.session({
    subject: saasSubject,
    scope: 'org:acme',
    roles: ['editor'],
  });

  const acmeManager = scopedSaasAuthz.session({
    subject: saasSubject,
    scope: 'org:acme',
    roles: ['manager'],
  });

  it('falls back to *.viewer for manager in org:acme', async () => {
    await expectCanMatrix(acmeManager, [
      { resource: 'project', action: 'read', expected: true },
      { resource: 'invoice', action: 'read', expected: true },
    ]);
  });

  it('applies owner-only delete in default scope', async () => {
    await expect(
      defaultEditor.can('project', 'delete', foreignProject),
    ).resolves.toBe(false);
  });

  it('replaces *.editor entirely in org:acme (unconditional delete)', async () => {
    await expect(
      acmeEditor.can('project', 'delete', foreignProject),
    ).resolves.toBe(true);
  });

  it('denies conditional invoice approve above limit', async () => {
    const session = scopedSaasAuthz.session({
      subject: saasSubject,
      scope: 'org:acme',
      roles: ['manager'],
    });

    await expect(session.can('project', 'read')).resolves.toBe(true);
    await expect(
      session.can('invoice', 'approve', { id: 'i2', amount: 50_000 }),
    ).resolves.toBe(false);
  });
});
