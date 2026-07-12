# 08 — Observer plugins

## Scenario

Register optional hooks for audit, logging, metrics, and tracing. Plugins **never** alter ALLOW/DENY decisions.

## Configuration

```typescript
import {
  createAuthorization,
  definePermissions,
  definePlugin,
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
    editor: {
      extends: ['viewer'],
      project: [
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.ownerId === subject.id,
        },
      ],
    },
  });

const audit = definePlugin({
  name: 'audit',
  onSessionCreate({ subject, scope, roles }) {
    console.log('session', { subject, scope, roles });
  },
  onGranted(ctx) {
    console.log('allowed', {
      source: ctx.source,
      resource: ctx.resource,
      action: ctx.action,
      grantedBy: ctx.grantedBy,
    });
  },
  onDenied(ctx) {
    if (ctx.source === 'explain') {
      console.log('denial detail', ctx.explanation);
      return;
    }

    console.log('denied', {
      source: ctx.source,
      resource: ctx.resource,
      action: ctx.action,
      reason: ctx.reason,
    });
  },
});

const authz = createAuthorization({
  resources,
  permissions,
  plugins: [audit],
});
```

## Sessions

```typescript
const session = authz.session({
  subject: { id: 'u1' },
  roles: ['viewer'],
});

session.can('project', 'read'); // triggers grant hooks
session.can('project', 'update'); // triggers deny hooks
```

## Expected behavior

### `onSessionCreate`

Runs **synchronously** when `authz.session()` is called:

```json
{
  "subject": { "id": "u1" },
  "scope": "*",
  "roles": ["viewer"],
  "context": undefined
}
```

### Evaluation hook order (allow)

For `can('project', 'read')` with a matching grant:

```text
onEvaluationStart → onGrantEvaluation → onEvaluationEnd → onGranted
```

### Evaluation hook order (deny)

For `can('project', 'update')` with no grant:

```text
onEvaluationStart → onEvaluationEnd → onDenied
```

### Conditional grants

`onGrantEvaluation` receives `conditional: true`, `matched: false` when `when` fails, and `grant.conditionId` when the grant uses a named condition.

### `source` and `explanation`

Every evaluation hook (except `onSessionCreate`) receives `source`:

| `source` | Triggered by |
| -------- | ------------ |
| `can` | `session.can()` |
| `cannot` | `session.cannot()` |
| `assert` | `session.assert()` |
| `explain` | `session.explain()` |
| `allowedActions` | each action in `session.allowedActions()` |

`onEvaluationEnd`, `onGranted`, and `onDenied` also receive `explanation` — the same object `session.explain()` would return for that evaluation. Use `source === 'explain'` in audit plugins when you only want detailed denial logs on explicit explain calls.

### `allowedActions`

Fires evaluation hooks **once per declared action** on the resource.

### No plugins = zero overhead

```typescript
createAuthorization({ resources, permissions }); // no hooks invoked
```

### Plugin errors propagate

If a hook throws, the error reaches the caller of `can()` / `explain()` / `allowedActions()`.

## Rules

- Plugins are observational only — they cannot change decisions
- Omit `plugins` entirely when audit is not needed
- All plugin hooks run synchronously

## Previous

[07 — Nested scopes](./07-nested-scopes.md)
