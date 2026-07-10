/**
 * Type-safety acceptance tests for the public session API,
 * against the same fixture used by acceptance.test.ts.
 */
import { describe, expectTypeOf, it } from 'vitest';
import { createAcceptanceSession, type User } from './fixtures/acceptance';

const session = createAcceptanceSession();

describe('session type safety', () => {
  it('accepts valid resource/action pairs', () => {
    expectTypeOf(
      session.can('project', 'read'),
    ).resolves.toEqualTypeOf<boolean>();
  });

  it('rejects actions from other resources', () => {
    // @ts-expect-error "approve" is not a project action
    void session.can('project', 'approve');
  });

  it('rejects unknown resources', () => {
    // @ts-expect-error "unknown-resource" is not declared
    void session.can('unknown-resource', 'read');
  });

  it('types the resource instance per resource', () => {
    void session.can('project', 'delete', { id: 'p1', ownerId: 'u1' });

    // @ts-expect-error invoice instance is not a project instance
    void session.can('project', 'delete', { id: 'i1', amount: 10 });
  });

  it('types allowedActions return per resource', () => {
    expectTypeOf(session.allowedActions('project')).resolves.toEqualTypeOf<
      ('read' | 'update' | 'delete')[]
    >();
  });

  it('types the session subject', () => {
    expectTypeOf(session.subject).toEqualTypeOf<User>();
  });
});
