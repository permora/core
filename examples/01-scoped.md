# 01 — Scoped multi-tenant

## Scenario

Use scopes to namespace roles per tenant. Learn per-role fallback to `*` and **full override** when a role exists in both scopes.

## Configuration

```typescript
import {
  createAuthorization,
  definePermissions,
  defineResource,
  defineResources,
} from '@permora/core';
import { scopedPermissions } from '@permora/core/scoped';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

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
        invoice: ['read'],
      },
    },
  });

const authz = createAuthorization({ resources, permissions });
```

## Sessions

```typescript
const subject: User = { id: 'user_123', approvalLimit: 10_000 };
const foreignProject: Project = { id: 'p2', ownerId: 'someone_else' };

const defaultEditor = authz.session({ subject, roles: ['editor'] });
const acmeEditor = authz.session({
  subject,
  scope: 'org:acme',
  roles: ['editor'],
});
const acmeManager = authz.session({
  subject,
  scope: 'org:acme',
  roles: ['manager'],
});
```

## Expected behavior

### Fallback per role

`viewer` is only defined under `*`. In `org:acme`, `manager` extends `viewer`, so `*.viewer` is used for the parent role.

| Session                                   | `project:read` | `invoice:read` |
| ----------------------------------------- | -------------- | -------------- |
| `scope: 'org:acme'`, `roles: ['manager']` | allow          | allow          |

### Full override (not merge)

`org:acme.editor` **replaces** `*.editor` entirely when both exist.

| Session                                  | `project:delete` (foreign project)     |
| ---------------------------------------- | -------------------------------------- |
| `scope: '*'`, `roles: ['editor']`        | deny (condition: owner only)           |
| `scope: 'org:acme'`, `roles: ['editor']` | allow (unconditional delete in tenant) |

### Resolution rule

```text
permissions[scope]?.[role] ?? permissions["*"]?.[role]
```

If `org:acme` defines `admin`, the entire `*.admin` definition is ignored — permissions are **not** merged per resource.

## Common mistakes

Assuming a scoped role **adds** permissions on top of the default:

```typescript
{
  '*': { admin: { user: ['read'] } },
  'org:arasaka': { admin: { invoice: ['approve'] } },
}
// scope: org:arasaka + admin → invoice:approve only, NOT user:read
```

## Next

[02 — Fallbacks and merge](./02-fallbacks-and-merge.md)
