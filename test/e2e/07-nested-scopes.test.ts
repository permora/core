/**
 * E2E mirror of examples/07-nested-scopes.md
 */
import { describe, expect, it } from 'vitest';
import {
  customSeparatorAuthz,
  flatAuthz,
  nestedAuthz,
  nestedSubject,
} from './fixtures/07-nested';

describe('e2e / 07 nested scopes', () => {
  it('resolves flat scope keys exactly', async () => {
    const session = flatAuthz.session({
      subject: nestedSubject,
      scope: 'org:acme',
      roles: ['admin'],
    });

    await expect(session.can('invoice', 'read')).resolves.toBe(true);
  });

  it('flattens nested trees with default separator', async () => {
    const session = nestedAuthz.session({
      subject: nestedSubject,
      scope: 'arasaka:staging',
      roles: ['admin'],
    });

    await expect(session.can('invoice', 'read')).resolves.toBe(true);
    await expect(session.can('invoice', 'create')).resolves.toBe(true);
  });

  it('uses custom separator when nested is true', async () => {
    const session = customSeparatorAuthz.session({
      subject: nestedSubject,
      scope: 'arasaka__staging',
      roles: ['admin'],
    });

    await expect(session.can('invoice', 'read')).resolves.toBe(true);
  });

  it('preserves default scope in nested trees', async () => {
    const session = nestedAuthz.session({
      subject: nestedSubject,
      scope: '*',
      roles: ['viewer'],
    });

    await expect(session.can('invoice', 'read')).resolves.toBe(true);
  });
});
