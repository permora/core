/**
 * E2E mirror of examples/02-fallbacks-and-merge.md
 */
import { describe, expect, it } from 'vitest';
import { UnknownRoleError } from '../../src/errors';
import { expectCanMatrix } from './helpers/assert-matrix';
import {
  defaultMergeAuthz,
  mergeAuthz,
  mergeSubject,
  strictAuthz,
  strictMergeAuthz,
} from './fixtures/02-merge';

describe('e2e / 02 fallbacks and merge', () => {
  describe('default (fallback: true, merge: false)', () => {
    const session = defaultMergeAuthz.session({
      subject: mergeSubject,
      scope: 'org:acme',
      roles: ['admin'],
    });

    it('allows tenant-specific invoice:approve', async () => {
      await expect(session.can('invoice', 'approve')).resolves.toBe(true);
    });

    it('denies project:update because org:acme.admin replaces *.admin', async () => {
      await expect(session.can('project', 'update')).resolves.toBe(false);
    });

    it('falls back viewer to *.viewer', async () => {
      const viewer = defaultMergeAuthz.session({
        subject: mergeSubject,
        scope: 'org:acme',
        roles: ['viewer'],
      });

      await expect(viewer.can('project', 'read')).resolves.toBe(true);
    });
  });

  describe('merge (merge: true)', () => {
    const session = mergeAuthz.session({
      subject: mergeSubject,
      scope: 'org:acme',
      roles: ['admin'],
    });

    it('merges *.admin with org:acme.admin', async () => {
      await expectCanMatrix(session, [
        { resource: 'project', action: 'read', expected: true },
        { resource: 'project', action: 'update', expected: true },
        { resource: 'invoice', action: 'approve', expected: true },
      ]);
    });
  });

  describe('strict (fallback: false)', () => {
    it('throws UnknownRoleError for viewer missing in scope', () => {
      expect(() =>
        strictAuthz.session({
          subject: mergeSubject,
          scope: 'org:acme',
          roles: ['viewer'],
        }),
      ).toThrow(UnknownRoleError);
    });

    it('allows admin defined in org:acme', async () => {
      const session = strictAuthz.session({
        subject: mergeSubject,
        scope: 'org:acme',
        roles: ['admin'],
      });

      await expect(session.can('invoice', 'approve')).resolves.toBe(true);
    });
  });

  describe('strict + merge (fallback: false, merge: true)', () => {
    const session = strictMergeAuthz.session({
      subject: mergeSubject,
      scope: 'org:acme',
      roles: ['admin'],
    });

    it('merges admin permissions from both scopes', async () => {
      await expectCanMatrix(session, [
        { resource: 'project', action: 'update', expected: true },
        { resource: 'invoice', action: 'read', expected: true },
        { resource: 'invoice', action: 'approve', expected: true },
      ]);
    });

    it('still throws for viewer without fallback', () => {
      expect(() =>
        strictMergeAuthz.session({
          subject: mergeSubject,
          scope: 'org:acme',
          roles: ['viewer'],
        }),
      ).toThrow(UnknownRoleError);
    });
  });
});
