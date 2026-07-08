import { describe, expect, it } from 'vitest';
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
  UnknownRoleError,
} from '../src/index';
import { scopedPermissions } from '../src/scoped';

type User = { id: string };
type Project = { id: string };

const resources = defineResources({
  project: defineResource<Project>({
    actions: ['read', 'update', 'delete'],
  }),
  invoice: defineResource<{ id: string }>({
    actions: ['read', 'approve'],
  }),
});

const permissionBuilder = definePermissions<User>();
const permissions = permissionBuilder(
  resources,
  {
    '*': {
      viewer: { project: ['read'] },
      admin: {
        extends: ['viewer'],
        project: ['read', 'update'],
        invoice: ['read'],
      },
    },
    'org:acme': {
      admin: { invoice: ['approve'] },
    },
  },
  { resolver: scopedPermissions() },
);

describe('scopeResolution via createAuthorization', () => {
  describe('default (fallback: true, merge: false)', () => {
    const authz = createAuthorization({ resources, permissions });

    it('falls back to *.viewer when missing in scope', async () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['viewer'],
      });

      await expect(session.can('project', 'read')).resolves.toBe(true);
    });

    it('replaces *.admin entirely with org:acme.admin', async () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      await expect(session.can('invoice', 'approve')).resolves.toBe(true);
      await expect(session.can('project', 'update')).resolves.toBe(false);
    });
  });

  describe('merge: true', () => {
    const authz = createAuthorization({
      resources,
      permissions,
      scopeResolution: { merge: true },
    });

    it('combines *.admin with org:acme.admin', async () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      await expect(session.can('project', 'read')).resolves.toBe(true);
      await expect(session.can('project', 'update')).resolves.toBe(true);
      await expect(session.can('invoice', 'approve')).resolves.toBe(true);
    });
  });

  describe('fallback: false (strict)', () => {
    const authz = createAuthorization({
      resources,
      permissions,
      scopeResolution: { fallback: false },
    });

    it('throws UnknownRoleError for roles only defined in "*"', () => {
      expect(() =>
        authz.session({
          subject: { id: 'u1' },
          scope: 'org:acme',
          roles: ['viewer'],
        }),
      ).toThrow(UnknownRoleError);
    });

    it('resolves roles defined in the session scope', async () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      await expect(session.can('invoice', 'approve')).resolves.toBe(true);
    });

    it('omits fallback hint from UnknownRoleError message', () => {
      try {
        authz.session({
          subject: { id: 'u1' },
          scope: 'org:acme',
          roles: ['viewer'],
        });
      } catch (error) {
        expect(error).toBeInstanceOf(UnknownRoleError);
        expect((error as UnknownRoleError).message).not.toContain('fallback');
      }
    });
  });

  describe('fallback: false + merge: true', () => {
    const mergePermissions = permissionBuilder(
      resources,
      {
        '*': {
          admin: { project: ['update'], invoice: ['read'] },
        },
        'org:acme': {
          admin: { invoice: ['approve'] },
        },
      },
      { resolver: scopedPermissions() },
    );

    const authz = createAuthorization({
      resources,
      permissions: mergePermissions,
      scopeResolution: { fallback: false, merge: true },
    });

    it('does not fall back to *.viewer', () => {
      expect(() =>
        authz.session({
          subject: { id: 'u1' },
          scope: 'org:acme',
          roles: ['viewer'],
        }),
      ).toThrow(UnknownRoleError);
    });

    it('merges when both *.admin and org:acme.admin exist', async () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      await expect(session.can('project', 'update')).resolves.toBe(true);
      await expect(session.can('invoice', 'read')).resolves.toBe(true);
      await expect(session.can('invoice', 'approve')).resolves.toBe(true);
    });
  });
});
