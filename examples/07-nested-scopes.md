# 07 — Nested scopes

## Scenario

Declare permissions as a nested scope tree instead of flat `scope → roles` keys. Use `scopedPermissions({ nested: true })` and optionally customize the segment separator.

## Configuration

### Flat mode (default)

Scope keys must match runtime exactly:

```typescript
import { scopedPermissions } from '@permora/core/scoped';

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    'org:acme': { admin: { invoice: ['read'] } },
  });

authz.session({ subject, scope: 'org:acme', roles: ['admin'] });
```

### Nested mode

```typescript
const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions({ nested: true }))
  .from({
    arasaka: {
      staging: {
        admin: { invoice: ['create', 'read'] },
      },
    },
  });
```

Canonical scope after flattening: `arasaka:staging` (default separator `:`).

### Custom separator

```typescript
const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions({ nested: true, separator: '__' }))
  .from({
    arasaka: {
      staging: { admin: { invoice: ['read'] } },
    },
  });
```

Canonical scope: `arasaka__staging`.

> `separator` is only applied when `nested: true`. In flat mode it is ignored.

## Sessions

```typescript
// Default separator
authz.session({
  subject: { id: 'u1' },
  scope: 'arasaka:staging',
  roles: ['admin'],
});

// Custom separator
authz.session({
  subject: { id: 'u1' },
  scope: 'arasaka__staging',
  roles: ['admin'],
});
```

## Expected behavior

| Mode          | Definition                   | Runtime `scope`      | `invoice:read` |
| ------------- | ---------------------------- | -------------------- | -------------- |
| Flat          | `'org:acme': { admin: ... }` | `'org:acme'`         | allow          |
| Nested        | `arasaka.staging.admin`      | `'arasaka:staging'`  | allow          |
| Nested + `__` | same tree                    | `'arasaka__staging'` | allow          |

The session `scope` must match the **canonical flattened key**, not the nested path segments separately.

### Default scope in nested trees

A top-level `'*'` entry with roles is preserved as the default scope:

```typescript
{
  '*': { viewer: { invoice: ['read'] } },
  arasaka: { staging: { admin: { invoice: ['create'] } } },
}
```

## Common mistakes

- Passing `scope: 'arasaka'` when the canonical key is `arasaka:staging`
- Setting `separator: '__'` in flat mode and expecting `org__acme` — flat keys stay `org:acme`

## Next

[08 — Plugins](./08-plugins.md)
