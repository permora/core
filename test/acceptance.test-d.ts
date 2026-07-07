/**
 * Type-safety acceptance tests for the public session API (SPEC §35).
 */
import { describe, expectTypeOf, it } from 'vitest';
import {
  createAuthorization,
  definePermissions,
  defineResources,
} from '../src/index';

type User = { id: string };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: {
    actions: ['read', 'update', 'delete'],
    resource: {} as Project,
  },
  invoice: {
    actions: ['read', 'approve'],
    resource: {} as Invoice,
  },
});

const permissions = definePermissions<User>()(resources, {
  '*': {
    viewer: { project: ['read'] },
  },
});

const authz = createAuthorization({ resources, permissions });

const session = authz.session({
  subject: { id: 'u1' },
  roles: ['viewer'],
});

describe('session type safety', () => {
  it('accepts valid resource/action pairs', () => {
    expectTypeOf(session.can('project', 'read')).toEqualTypeOf<
      Promise<boolean>
    >();
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
    expectTypeOf(session.allowedActions('project')).toEqualTypeOf<
      Promise<('read' | 'update' | 'delete')[]>
    >();
  });

  it('types the session subject', () => {
    expectTypeOf(session.subject).toEqualTypeOf<User>();
  });
});
