# 02 — Fallbacks and merge (`scopeResolution`)

## Scenario

Control how scoped roles are resolved at session compile time using `createAuthorization({ scopeResolution })`.

## Configuration

Shared permissions definition:

```typescript
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '@permora/core';
import { scopedPermissions } from '@permora/core/scoped';

type User = { id: string };

const resources = defineResources({
  project: defineResource<{ id: string }>().actions([
    'read',
    'update',
    'delete',
  ]),
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
```

## Modes

| `fallback` | `merge` | Behavior                                                            |
| :--------: | :-----: | ------------------------------------------------------------------- |
|   `true`   | `false` | **Default** — fallback per role; specific replaces `*` entirely     |
|   `true`   | `true`  | Fallback when absent; merge `*.role` + `scope.role` when both exist |
|  `false`   | `false` | Strict — only roles defined in the session scope                    |
|  `false`   | `true`  | No fallback; merge when both exist in the session scope             |

```typescript
// Default (omit scopeResolution)
const defaultAuthz = createAuthorization({ resources, permissions });

// Merge mode
const mergeAuthz = createAuthorization({
  resources,
  permissions,
  scopeResolution: { merge: true },
});

// Strict mode
const strictAuthz = createAuthorization({
  resources,
  permissions,
  scopeResolution: { fallback: false },
});
```

## Expected behavior

### Default (`fallback: true`, `merge: false`)

```typescript
const session = defaultAuthz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['admin'],
});
```

| Action                       | Result | Why                                                         |
| ---------------------------- | ------ | ----------------------------------------------------------- |
| `invoice:approve`            | allow  | Defined in `org:acme.admin`                                 |
| `project:update`             | deny   | `org:acme.admin` replaces `*.admin` — no `update` in tenant |
| `project:read` (as `viewer`) | allow  | `viewer` falls back to `*.viewer`                           |

```typescript
// viewer only exists in *
defaultAuthz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['viewer'],
});
// → allow project:read (fallback to *.viewer)
```

### Merge (`merge: true`)

```typescript
const session = mergeAuthz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['admin'],
});
```

| Action            | Result |
| ----------------- | ------ |
| `project:read`    | allow  |
| `project:update`  | allow  |
| `invoice:approve` | allow  |

### Strict (`fallback: false`)

```typescript
strictAuthz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['viewer'],
});
// → throws UnknownRoleError (viewer not defined in org:acme)
```

```typescript
const session = strictAuthz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['admin'],
});
// → allow invoice:approve
```

### Strict + merge (`fallback: false`, `merge: true`)

With permissions where both scopes define `admin`:

```typescript
{
  '*': { admin: { project: ['update'], invoice: ['read'] } },
  'org:acme': { admin: { invoice: ['approve'] } },
}
```

| Action            | Result                        |
| ----------------- | ----------------------------- |
| `project:update`  | allow (from `*.admin`)        |
| `invoice:read`    | allow (from `*.admin`)        |
| `invoice:approve` | allow (from `org:acme.admin`) |

`viewer` still **throws** `UnknownRoleError` — no fallback.

## Common mistakes

- Enabling `merge: true` and expecting parent roles from `extends` to resolve via `*` when `fallback: false` — merged `extends` still resolve with the same flags
- Assuming `merge` applies per resource — merge is per **role name**, not per resource

## Next

[03 — Inheritance](./03-inheritance.md)
