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
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<{ id: string }>().actions(['read', 'approve']),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
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
  });

describe('scopeResolution via createAuthorization', () => {
  describe('default (fallback: true, merge: false)', () => {
    const authz = createAuthorization({ resources, permissions });

    it('falls back to *.viewer when missing in scope', () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['viewer'],
      });

      expect(session.can('project', 'read')).toBe(true);
    });

    it('replaces *.admin entirely with org:acme.admin', () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      expect(session.can('invoice', 'approve')).toBe(true);
      expect(session.can('project', 'update')).toBe(false);
    });
  });

  describe('merge: true', () => {
    const authz = createAuthorization({
      resources,
      permissions,
      scopeResolution: { merge: true },
    });

    it('combines *.admin with org:acme.admin', () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      expect(session.can('project', 'read')).toBe(true);
      expect(session.can('project', 'update')).toBe(true);
      expect(session.can('invoice', 'approve')).toBe(true);
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

    it('resolves roles defined in the session scope', () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      expect(session.can('invoice', 'approve')).toBe(true);
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
    const mergePermissions = definePermissions({ resources })
      .forSubject<User>()
      .with(scopedPermissions())
      .from({
        '*': {
          admin: { project: ['update'], invoice: ['read'] },
        },
        'org:acme': {
          admin: { invoice: ['approve'] },
        },
      });

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

    it('merges when both *.admin and org:acme.admin exist', () => {
      const session = authz.session({
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['admin'],
      });

      expect(session.can('project', 'update')).toBe(true);
      expect(session.can('invoice', 'read')).toBe(true);
      expect(session.can('invoice', 'approve')).toBe(true);
    });
  });
});
