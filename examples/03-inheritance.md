# 03 — Role inheritance

## Scenario

Roles can declare `extends` to inherit permissions from parent roles. Inheritance is transitive and resolved per scope.

## Configuration

```typescript
const permissions = {
  '*': {
    viewer: { project: ['read'] },
    editor: { extends: ['viewer'], project: ['update'] },
    manager: { extends: ['editor'], invoice: ['read'] },
  },
  'org:acme': {
    manager: { extends: ['editor'], invoice: ['approve'] },
    editor: { extends: ['viewer'], project: ['read', 'update', 'delete'] },
  },
};

const authz = createAuthorization({ resources, permissions });
```

## Sessions

```typescript
const session = authz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['manager'],
});
```

## Expected behavior

### Transitive chain (DFS order)

Reachable roles are collected depth-first:

```text
manager → editor → viewer
```

`session.permissionGraph().resolvedRoles` maps to:

```text
org:acme.manager → org:acme.editor → *.viewer
```

(`viewer` falls back to `*` because it is not defined in `org:acme`.)

| Action            | Result | Granted via                |
| ----------------- | ------ | -------------------------- |
| `project:read`    | allow  | `viewer` (inherited)       |
| `project:update`  | allow  | `editor`                   |
| `project:delete`  | allow  | `org:acme.editor` override |
| `invoice:approve` | allow  | `org:acme.manager`         |

### Multiple parents

```typescript
{
  '*': {
    viewer: {},
    billing: {},
    manager: { extends: ['viewer', 'billing'] },
  },
}
```

Input `roles: ['manager']` collects: `*.manager`, `*.viewer`, `*.billing`.

### Diamond deduplication

```typescript
{
  '*': {
    base: {},
    left: { extends: ['base'] },
    right: { extends: ['base'] },
    top: { extends: ['left', 'right'] },
  },
}
```

`base` appears once in the resolved graph even though two paths reach it.

### Circular inheritance

```typescript
{
  '*': {
    admin: { extends: ['manager'] },
    manager: { extends: ['editor'] },
    editor: { extends: ['admin'] },
  },
}
```

```typescript
authz.session({ subject: {}, roles: ['admin'] });
// → throws CircularRoleInheritanceError
// path: ["admin", "manager", "editor", "admin"]
```

### Unknown parent

```typescript
{
  '*': {
    editor: { extends: ['ghost'] },
  },
}
```

```typescript
authz.session({ subject: {}, roles: ['editor'] });
// → throws UnknownRoleError for role "ghost"
```

## Common mistakes

### Expecting `extends` from `*` when the scoped role replaces it entirely

If `org:acme` defines `editor` without `extends`, the default-scope definition is **ignored in full** — including its `extends: ['viewer']`.

```typescript
const permissions = {
  '*': {
    viewer: { project: ['read'] },
    editor: {
      extends: ['viewer'],
      project: ['read', 'update'],
    },
  },
  'org:acme': {
    editor: { project: ['read'] }, // no extends — replaces *.editor entirely
  },
};

const session = authz.session({
  subject: { id: 'u1' },
  scope: 'org:acme',
  roles: ['editor'],
});
```

| Action                    | Result | Why                                                                          |
| ------------------------- | ------ | ---------------------------------------------------------------------------- |
| `project:read`            | allow  | Declared on `org:acme.editor`                                                |
| `project:update`          | deny   | `*.editor.update` is not inherited — override dropped the whole default role |
| Inherited `viewer` grants | deny   | `extends: ['viewer']` from `*.editor` is not applied                         |

`permissionGraph()` collects only `org:acme.editor` — not `*.viewer`.

**Fix:** repeat `extends` (and any needed permissions) in the scoped role, or omit `editor` from the scope when the `*` definition is enough. See [01-scoped](./01-scoped.md).

- Creating cycles with the same role name across scopes without testing session creation

## Next

[04 — Conditions](./04-conditions.md)
