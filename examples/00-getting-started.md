# 00 — Getting started (single-tenant)

## Scenario

Configure a minimal single-tenant app: roles without a scope wrapper, implicit default scope `*`, and default deny.

## Configuration

```typescript
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '@permora/core';

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
      post: ['create', 'update'],
    },
  });

const authz = createAuthorization({ resources, permissions });
```

## Sessions

```typescript
const subject: User = { id: 'u2' };

const viewerSession = authz.session({ subject, roles: ['viewer'] });
const editorSession = authz.session({ subject, roles: ['editor'] });
```

## Expected behavior

| Session             | `post:read` | `post:create` | `post:update` | `post:delete` |
| ------------------- | ----------- | ------------- | ------------- | ------------- |
| `roles: ['viewer']` | allow       | deny          | deny          | deny          |
| `roles: ['editor']` | allow       | allow         | allow         | deny          |

Additional expectations:

- `viewerSession.scope` is `'*'` (implicit default scope)
- `await editorSession.can('post', 'read')` is `true` via inheritance (`editor` → `viewer`)
- `await viewerSession.assert('post', 'update')` **throws** `AuthorizationDeniedError`

## Common mistakes

- Expecting permissions without an explicit grant — the engine is **default deny**
- Passing `scope` in single-tenant apps — optional; omitting it uses `*`

## Next

[01 — Scoped multi-tenant](./01-scoped.md)
