/**
 * E2E mirror of examples/09-portable-sessions.md
 */
import { describe, expect, it } from 'vitest';
import {
  PortableInlineConditionError,
  PortableSessionInvalidError,
  PortableSessionStaleError,
  createSessionFromPortable,
} from '../../src/index';
import { testResources } from '../fixtures/resources';
import {
  expectSameDecisions,
  roundtripPortable,
} from './helpers/portable-roundtrip';
import {
  expensiveInvoice,
  inlineWhenAuthz,
  portableAuthz,
  portableInvoice,
  portableProject,
  portableSubject,
} from './fixtures/09-portable';

describe('e2e / 09 portable sessions', () => {
  const session = portableAuthz.session({
    subject: portableSubject,
    scope: 'org:acme',
    roles: ['manager'],
    context: {},
  });

  const decisionMatrix = [
    { resource: 'project', action: 'read', expected: true },
    {
      resource: 'project',
      action: 'delete',
      expected: true,
      resourceInstance: portableProject,
    },
    {
      resource: 'invoice',
      action: 'approve',
      expected: true,
      resourceInstance: portableInvoice,
    },
    {
      resource: 'invoice',
      action: 'approve',
      expected: false,
      resourceInstance: expensiveInvoice,
    },
  ] as const;

  it('exports portable payload with named conditions', () => {
    const portable = session.toPortable();

    expect(portable).toMatchObject({
      v: 1,
      scope: 'org:acme',
      roles: ['manager'],
      subject: portableSubject,
    });
    expect(portable.grants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resource: 'project',
          action: 'delete',
          condition: 'owner-only',
        }),
        expect.objectContaining({
          resource: 'invoice',
          action: 'approve',
          condition: 'within-limit',
        }),
      ]),
    );
  });

  it('roundtrips JSON portable payload with identical decisions', async () => {
    const restored = await roundtripPortable(session, {
      resources: testResources,
      context: {},
      wire: 'json',
    });

    await expectSameDecisions(session, restored, decisionMatrix);
  });

  it('roundtrips compact wire format with identical decisions', async () => {
    const restored = await roundtripPortable(session, {
      resources: testResources,
      context: {},
      wire: 'compact',
    });

    await expectSameDecisions(session, restored, decisionMatrix);
  });

  it('throws PortableInlineConditionError for inline when grants', () => {
    const inlineSession = inlineWhenAuthz.session({
      subject: portableSubject,
      roles: ['editor'],
      context: {},
    });

    expect(() => inlineSession.toPortable()).toThrow(
      PortableInlineConditionError,
    );
  });

  it('throws PortableSessionStaleError when condition registry changed', () => {
    const portable = session.toPortable();
    const staleResources = {
      ...testResources,
      project: {
        ...testResources.project,
        conditions: {},
      },
    };

    expect(() =>
      createSessionFromPortable(portable, { resources: staleResources }),
    ).toThrow(PortableSessionStaleError);
  });

  it('throws PortableSessionInvalidError for malformed payloads', () => {
    expect(() =>
      createSessionFromPortable(null, { resources: testResources }),
    ).toThrow(PortableSessionInvalidError);
  });

  it('preserves explain decisions after rehydration', async () => {
    const restored = await roundtripPortable(session, {
      resources: testResources,
      context: {},
    });

    const originalExplain = await session.explain(
      'invoice',
      'approve',
      expensiveInvoice,
    );
    const restoredExplain = await restored.explain(
      'invoice',
      'approve',
      expensiveInvoice,
    );

    expect(restoredExplain.allowed).toBe(originalExplain.allowed);
    expect(restoredExplain.reason).toBe(originalExplain.reason);
  });

  it('preserves allowedActions after rehydration', async () => {
    const restored = await roundtripPortable(session, {
      resources: testResources,
      context: {},
    });

    await expect(
      session.allowedActions('project', portableProject),
    ).resolves.toEqual(
      await restored.allowedActions('project', portableProject),
    );
  });
});
