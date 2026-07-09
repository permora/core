import { describe, expect, it } from 'vitest';
import {
  createAuthorization,
  createSessionFromPortable,
  decodePortableSession,
  definePermissions,
  encodePortableSession,
  PortableInlineConditionError,
  PortableSessionInvalidError,
  PortableSessionStaleError,
} from '../../src/index';
import { scopedPermissions } from '../../src/scoped';
import { testResources } from '../fixtures/resources';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const permissions = definePermissions({ resources: testResources })
  .forSubject<User, Record<string, never>>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      editor: {
        extends: ['viewer'],
        project: ['update', { action: 'delete', condition: 'owner-only' }],
      },
    },
    'org:acme': {
      manager: {
        extends: ['editor'],
        invoice: ['read', { action: 'approve', condition: 'within-limit' }],
      },
    },
  });

const authz = createAuthorization({ resources: testResources, permissions });

describe('portable sessions', () => {
  const project: Project = { id: 'p1', ownerId: 'user_123' };
  const invoice: Invoice = { id: 'i1', amount: 5_000 };

  it('exports and rehydrates a session with named conditions', async () => {
    const original = authz.session({
      subject: { id: 'user_123', approvalLimit: 10_000 },
      scope: 'org:acme',
      roles: ['manager'],
      context: {},
    });

    const portable = original.toPortable();

    expect(portable).toEqual({
      v: 1,
      scope: 'org:acme',
      roles: ['manager'],
      subject: { id: 'user_123', approvalLimit: 10_000 },
      grants: expect.arrayContaining([
        {
          resource: 'project',
          action: 'read',
          sourceScope: '*',
          sourceRole: 'viewer',
        },
        {
          resource: 'project',
          action: 'delete',
          sourceScope: '*',
          sourceRole: 'editor',
          condition: 'owner-only',
        },
        {
          resource: 'invoice',
          action: 'approve',
          sourceScope: 'org:acme',
          sourceRole: 'manager',
          condition: 'within-limit',
        },
      ]),
    });

    const restored = createSessionFromPortable(portable, {
      resources: testResources,
      context: {},
    });

    await expect(restored.can('project', 'delete', project)).resolves.toBe(
      true,
    );
    await expect(restored.can('invoice', 'approve', invoice)).resolves.toBe(
      true,
    );
    await expect(
      restored.can('invoice', 'approve', { id: 'i2', amount: 50_000 }),
    ).resolves.toBe(false);
  });

  it('throws when exporting inline when conditions', () => {
    const inlinePermissions = definePermissions({ resources: testResources })
      .forSubject<User, Record<string, never>>()
      .from({
        editor: {
          project: [
            {
              action: 'delete',
              when: ({ subject, resource }) => resource.ownerId === subject.id,
            },
          ],
        },
      });

    const inlineAuthz = createAuthorization({
      resources: testResources,
      permissions: inlinePermissions,
    });

    const session = inlineAuthz.session({
      subject: { id: 'user_123', approvalLimit: 0 },
      roles: ['editor'],
      context: {},
    });

    expect(() => session.toPortable()).toThrow(PortableInlineConditionError);
  });

  it('rejects stale condition ids after registry changes', () => {
    const portable = authz
      .session({
        subject: { id: 'user_123', approvalLimit: 10_000 },
        scope: 'org:acme',
        roles: ['manager'],
        context: {},
      })
      .toPortable();

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

  it('rejects unknown resources and actions', () => {
    const portable = authz
      .session({
        subject: { id: 'user_123', approvalLimit: 10_000 },
        roles: ['viewer'],
        context: {},
      })
      .toPortable();

    expect(() =>
      createSessionFromPortable(portable, {
        resources: { invoice: testResources.invoice },
      }),
    ).toThrow(PortableSessionStaleError);

    const brokenPortable = {
      ...portable,
      grants: [
        {
          ...portable.grants[0]!,
          action: 'archive',
        },
      ],
    };

    expect(() =>
      createSessionFromPortable(brokenPortable, { resources: testResources }),
    ).toThrow(PortableSessionStaleError);
  });

  it('rejects malformed portable payloads', () => {
    expect(() =>
      createSessionFromPortable(null, { resources: testResources }),
    ).toThrow(PortableSessionInvalidError);

    expect(() =>
      createSessionFromPortable({ v: 99 }, { resources: testResources }),
    ).toThrow(PortableSessionInvalidError);
  });

  it('round-trips compact encoding', () => {
    const portable = authz
      .session({
        subject: { id: 'user_123', approvalLimit: 10_000 },
        scope: 'org:acme',
        roles: ['manager'],
        context: {},
      })
      .toPortable();

    const compact = encodePortableSession(portable);
    const decoded = decodePortableSession(compact);

    expect(decoded).toEqual(portable);
  });
});
