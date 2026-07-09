# 04 — Conditional permissions (`when`)

## Scenario

Attach sync or async predicates to permissions. Conditions run at evaluation time (`can`, `explain`, `allowedActions`) — not during session compilation.

## Configuration

```typescript
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '@permora/core';

type User = { id: string; approvalLimit: number };
type Post = { id: string; authorId: string; published: boolean };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  post: defineResource<Post>().actions([
    'read',
    'create',
    'update',
    'delete',
    'publish',
  ]),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .from({
    editor: {
      post: [
        'read',
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.authorId === subject.id,
        },
      ],
    },
  });

// Multi-tenant example (scoped)
import { scopedPermissions } from '@permora/core/scoped';

const tenantPermissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    'org:acme': {
      manager: {
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

const tenantAuthz = createAuthorization({
  resources,
  permissions: tenantPermissions,
});
```

## Sessions

```typescript
const subject: User = { id: 'u2', approvalLimit: 10_000 };
const ownPost: Post = { id: 'p1', authorId: 'u2', published: false };
const otherPost: Post = { id: 'p2', authorId: 'u1', published: false };
const smallInvoice: Invoice = { id: 'i1', amount: 500 };
const largeInvoice: Invoice = { id: 'i2', amount: 50_000 };

const session = authz.session({ subject, roles: ['editor'] });
```

## Expected behavior

### With and without resource instance

| Call                               | Result               |
| ---------------------------------- | -------------------- |
| `can('post', 'read')`              | allow (no condition) |
| `can('post', 'delete', ownPost)`   | allow                |
| `can('post', 'delete', otherPost)` | deny                 |

Unconditional grants do not require a resource instance. Conditional grants need the instance for `when` to run.

### `explain` on denial

```typescript
const explanation = await session.explain('post', 'delete', otherPost);
```

```json
{
  "allowed": false,
  "reason": "ALL_CONDITIONS_FAILED",
  "grantedBy": undefined,
  "evaluatedGrants": [
    {
      "sourceScope": "*",
      "sourceRole": "editor",
      "action": "delete",
      "conditional": true,
      "matched": false
    }
  ]
}
```

### Scoped conditional (manager + invoice)

```typescript
const acme = tenantAuthz.session({
  subject,
  scope: 'org:acme',
  roles: ['manager'],
});

await acme.can('invoice', 'approve', smallInvoice); // allow
await acme.can('invoice', 'approve', largeInvoice); // deny
```

### `permissionGraph` vs conditions

```typescript
session.permissionGraph();
// post.delete → { conditional: true }
// when is NOT executed during compilation
```

## Common mistakes

- Calling `can('post', 'delete')` without an instance when the only grant has `when` — may deny if no unconditional grant exists
- Expecting `permissionGraph()` to show whether a condition passed — use `explain()` or `allowedActions()`

## Next

[05 — Wildcards](./05-wildcards.md)
