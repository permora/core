import { describe, expect, it } from 'vitest';
import {
  AuthorizationDeniedError,
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '../src/index';

type User = { id: string };
type Post = { id: string; authorId: string; published: boolean };

const resources = defineResources({
  post: defineResource<Post>().actions([
    'read',
    'create',
    'update',
    'delete',
    'publish',
  ]),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .from({
    viewer: {
      post: ['read'],
    },
    editor: {
      extends: ['viewer'],
      post: [
        'create',
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.authorId === subject.id,
        },
      ],
    },
    admin: {
      post: ['*'],
    },
  });

const authz = createAuthorization({ resources, permissions });

describe('single-tenant authorization', () => {
  const subject: User = { id: 'u2' };
  const ownDraft: Post = { id: 'p1', authorId: 'u2', published: false };
  const otherDraft: Post = { id: 'p2', authorId: 'u1', published: false };

  it('uses the implicit default scope for sessions without scope', async () => {
    const session = authz.session({
      subject,
      roles: ['editor'],
    });

    expect(session.scope).toBe('*');
    await expect(session.can('post', 'read')).resolves.toBe(true);
    await expect(session.can('post', 'create')).resolves.toBe(true);
  });

  it('enforces ownership conditions for destructive actions', async () => {
    const session = authz.session({
      subject,
      roles: ['editor'],
    });

    await expect(session.can('post', 'delete', ownDraft)).resolves.toBe(true);
    await expect(session.can('post', 'delete', otherDraft)).resolves.toBe(
      false,
    );
  });

  it('returns a useful denial explanation when the condition fails', async () => {
    const session = authz.session({
      subject,
      roles: ['editor'],
    });

    const explanation = await session.explain('post', 'delete', otherDraft);

    expect(explanation.allowed).toBe(false);
    expect(explanation.reason).toBe('ALL_CONDITIONS_FAILED');
    expect(explanation.grantedBy).toBeUndefined();
    expect(explanation.evaluatedGrants).toEqual([
      {
        sourceScope: '*',
        sourceRole: 'editor',
        action: 'delete',
        conditional: true,
        matched: false,
      },
    ]);
  });

  it('lets admins perform any declared action', async () => {
    const session = authz.session({
      subject,
      roles: ['admin'],
    });

    await expect(session.allowedActions('post', otherDraft)).resolves.toEqual([
      'read',
      'create',
      'update',
      'delete',
      'publish',
    ]);
  });

  it('throws AuthorizationDeniedError on denied assertions', async () => {
    const session = authz.session({
      subject,
      roles: ['editor'],
    });

    let caught: unknown;
    try {
      await session.assert('post', 'delete', otherDraft);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(AuthorizationDeniedError);
    expect((caught as AuthorizationDeniedError).scope).toBe('*');
  });
});
