# 06 — Explain and permission graph

## Scenario

Compare three introspection APIs: full compile snapshot (`permissionGraph`), per-action decision (`explain`), and filtered action list (`allowedActions`).

## Configuration

Use the multi-tenant fixture from [01-scoped](./01-scoped.md):

```typescript
import { scopedPermissions } from '@permora/core/scoped';

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
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
    },
    'org:acme': {
      editor: {
        extends: ['viewer'],
        project: ['read', 'update', 'delete'],
      },
      manager: {
        extends: ['editor'],
        invoice: [
          'read',
          {
            action: 'approve',
            when: ({ subject, resource }) =>
              resource.amount <= subject.approvalLimit,
          },
        ],
      },
    },
  });
```

## Session

```typescript
const subject = { id: 'user_123', approvalLimit: 10_000 };
const foreignProject = { id: 'p2', ownerId: 'someone_else' };
const largeInvoice = { id: 'i2', amount: 50_000 };

const session = authz.session({
  subject,
  scope: 'org:acme',
  roles: ['manager'],
});
```

## `permissionGraph()` — compile snapshot (sync)

Does **not** evaluate `when`. Returns reachable roles in DFS order:

```typescript
const tree = session.permissionGraph();
```

```json
{
  "scope": "org:acme",
  "roles": ["manager"],
  "resolvedRoles": [
    {
      "sourceScope": "org:acme",
      "role": "manager",
      "extends": ["editor"],
      "permissions": [
        { "resource": "invoice", "action": "read", "conditional": false },
        { "resource": "invoice", "action": "approve", "conditional": true }
      ]
    },
    {
      "sourceScope": "org:acme",
      "role": "editor",
      "extends": ["viewer"],
      "permissions": [
        { "resource": "project", "action": "read", "conditional": false },
        { "resource": "project", "action": "update", "conditional": false },
        { "resource": "project", "action": "delete", "conditional": false }
      ]
    },
    {
      "sourceScope": "*",
      "role": "viewer",
      "permissions": [
        { "resource": "project", "action": "read", "conditional": false }
      ]
    }
  ]
}
```

## `explain()` — per-action decision

```typescript
const explanation = session.explain('project', 'delete', foreignProject);
```

```json
{
  "allowed": true,
  "grantedBy": {
    "sourceScope": "org:acme",
    "sourceRole": "editor",
    "action": "delete"
  },
  "reason": "GRANT_MATCHED"
}
```

Conditional grant that fails:

```typescript
session.explain('invoice', 'approve', largeInvoice);
// allowed: false, reason: "ALL_CONDITIONS_FAILED"
```

## `allowedActions()` — allowed declared actions

Evaluates every action declared on the resource:

```typescript
session.allowedActions('project', foreignProject);
// → ['read', 'update', 'delete']

session.allowedActions('invoice', largeInvoice);
// → ['read']  (approve denied by when)
```

## Comparison

| API                         | Sync | Evaluates `when` | Scope                            |
| --------------------------- | ---- | ---------------- | -------------------------------- |
| `permissionGraph()`         | yes  | no               | Full reachable role graph        |
| `explain(resource, action)` | no   | yes              | Single action                    |
| `allowedActions(resource)`  | no   | yes              | All declared actions on resource |

## Common mistakes

- Using `permissionGraph()` to audit final access decisions — conditions may still deny
- Expecting `explain` to list all grants in the session — it only evaluates candidates for one resource/action pair

## Next

[07 — Nested scopes](./07-nested-scopes.md)
