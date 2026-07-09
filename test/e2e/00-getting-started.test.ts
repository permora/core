/**
 * E2E mirror of examples/00-getting-started.md
 */
import { describe, expect, it } from 'vitest';
import { AuthorizationDeniedError } from '../../src/errors';
import { expectCanMatrix } from './helpers/assert-matrix';
import { blogAuthz, blogSubject } from './fixtures/00-blog';

describe('00 getting-started', () => {
  const viewerSession = blogAuthz.session({
    subject: blogSubject,
    roles: ['viewer'],
  });

  const editorSession = blogAuthz.session({
    subject: blogSubject,
    roles: ['editor'],
  });

  it('uses implicit default scope', () => {
    expect(viewerSession.scope).toBe('*');
  });

  it('matches viewer permission matrix', async () => {
    await expectCanMatrix(viewerSession, [
      { resource: 'post', action: 'read', expected: true },
      { resource: 'post', action: 'create', expected: false },
      { resource: 'post', action: 'update', expected: false },
      { resource: 'post', action: 'delete', expected: false },
    ]);
  });

  it('matches editor permission matrix via inheritance', async () => {
    await expectCanMatrix(editorSession, [
      { resource: 'post', action: 'read', expected: true },
      { resource: 'post', action: 'create', expected: true },
      { resource: 'post', action: 'update', expected: true },
      { resource: 'post', action: 'delete', expected: false },
    ]);
  });

  it('throws AuthorizationDeniedError on assert when denied', async () => {
    await expect(viewerSession.assert('post', 'update')).rejects.toBeInstanceOf(
      AuthorizationDeniedError,
    );
  });
});
