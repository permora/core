# 05 — Wildcard actions (`"*"`)

## Scenario

Grant every declared action of a resource with a single `["*"]` entry. Wildcards are stored as-is during compilation and expanded only when listing allowed actions.

## Configuration

```typescript
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '@permora/core';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .from({
    viewer: { project: ['read'] },
    admin: { project: ['*'] },
  });

const authz = createAuthorization({ resources, permissions });
```

## Sessions

```typescript
const subject: User = { id: 'user_123' };
const foreignProject: Project = { id: 'p2', ownerId: 'someone_else' };

const adminSession = authz.session({ subject, roles: ['admin'] });
const viewerSession = authz.session({ subject, roles: ['viewer'] });
```

## Expected behavior

### `can` uses wildcard grants directly

| Session             | `project:read` | `project:update` | `project:delete` |
| ------------------- | -------------- | ---------------- | ---------------- |
| `roles: ['viewer']` | allow          | deny             | deny             |
| `roles: ['admin']`  | allow          | allow            | allow            |

```typescript
adminSession.can('project', 'delete', foreignProject); // allow
```

### Compilation does not expand `*`

```typescript
adminSession.permissionGraph();
// permissions include { resource: "project", action: "*", conditional: false }
// NOT separate entries for read, update, delete
```

### `allowedActions` expands against declared actions

```typescript
adminSession.allowedActions('project');
// → ['read', 'update', 'delete']
```

Each declared action is evaluated individually (including any `when` on wildcard grants).

### Multiple roles combine grants (OR)

```typescript
authz.session({ subject, roles: ['viewer', 'admin'] });
session.can('project', 'update'); // allow (from admin wildcard)
```

## Common mistakes

- Expecting `permissionGraph()` to list expanded actions — expansion happens in `allowedActions()` only
- Using `*` for resources not declared in `defineResources` — validation fails at `createAuthorization()` time

## Next

[06 — Explain and permission graph](./06-explain-and-permission-graph.md)
