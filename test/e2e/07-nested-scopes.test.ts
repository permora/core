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
  it('resolves flat scope keys exactly', () => {
    const session = flatAuthz.session({
      subject: nestedSubject,
      scope: 'org:acme',
      roles: ['admin'],
    });

    expect(session.can('invoice', 'read')).toBe(true);
  });

  it('flattens nested trees with default separator', () => {
    const session = nestedAuthz.session({
      subject: nestedSubject,
      scope: 'arasaka:staging',
      roles: ['admin'],
    });

    expect(session.can('invoice', 'read')).toBe(true);
    expect(session.can('invoice', 'create')).toBe(true);
  });

  it('uses custom separator when nested is true', () => {
    const session = customSeparatorAuthz.session({
      subject: nestedSubject,
      scope: 'arasaka__staging',
      roles: ['admin'],
    });

    expect(session.can('invoice', 'read')).toBe(true);
  });

  it('preserves default scope in nested trees', () => {
    const session = nestedAuthz.session({
      subject: nestedSubject,
      scope: '*',
      roles: ['viewer'],
    });

    expect(session.can('invoice', 'read')).toBe(true);
  });
});
