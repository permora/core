# @permora/core

![CI](https://github.com/cicerotcv/permora/actions/workflows/ci.yml/badge.svg?branch=main)
![node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript&logoColor=white)
![tsup](https://img.shields.io/badge/tsup-8-FFEA00?logo=esbuild&logoColor=black)
![prettier](https://img.shields.io/badge/prettier-3-F7B93E?logo=prettier&logoColor=white)

Type-safe authorization engine based on scopes, roles, inheritance, permissions and dynamic conditions. Framework-agnostic, default deny, zero runtime dependencies.

```text
Scope → Role → Inheritance → Resource → Permission → Condition → Decision
```

## Features

- **Type-safe**: resources, actions, resource instances, subject and context are fully inferred; invalid actions fail at compile time
- **Default deny**: nothing is allowed unless explicitly granted
- **Scopes**: generic namespaces (`*`, `org:acme`, `project:123`) with per-role fallback to the default scope `*`
- **Role inheritance**: transitive `extends` with cycle detection, resolved per scope
- **Conditions**: sync or async `when` predicates receiving `{ subject, scope, resource, context }`
- **Wildcard actions**: `["*"]` grants every declared action of a resource
- **Explainability**: `session.explain()` reports which grant or condition decided
- **Partial compilation**: sessions only compile the roles they can reach — O(reachable roles + permissions)

## Requirements

- Node.js >= 20

## Installation

```bash
pnpm add @permora/core
# or
npm install @permora/core
```

## Usage

```typescript
import {
  createAuthorization,
  definePermissions,
  defineResources,
} from '@permora/core';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: {
    actions: ['read', 'update', 'delete'],
    resource: {} as Project,
  },
  invoice: {
    actions: ['read', 'approve'],
    resource: {} as Invoice,
  },
});

const permissions = definePermissions<User>()(resources, {
  '*': {
    viewer: {
      project: ['read'],
    },
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

const authz = createAuthorization({ resources, permissions });

const session = authz.session({
  subject: { id: 'user_123', approvalLimit: 10_000 },
  scope: 'org:acme',
  roles: ['manager'],
});

await session.can('project', 'read'); // true (manager → editor → viewer)
await session.can('project', 'delete', project); // true (org:acme editor override)
await session.assert('invoice', 'approve', invoice); // resolves or throws AuthorizationDeniedError
await session.explain('project', 'delete', project); // { allowed, grantedBy, reason, ... }
await session.allowedActions('project', project); // ['read', 'update', 'delete']
```

Single-tenant applications can omit `scope` — sessions default to the `*` scope.

### Session API

| Method                                 | Returns                             | Description                                    |
| -------------------------------------- | ----------------------------------- | ---------------------------------------------- |
| `can(resource, action, instance?)`     | `Promise<boolean>`                  | True when any grant allows the action          |
| `cannot(resource, action, instance?)`  | `Promise<boolean>`                  | Negation of `can`                              |
| `assert(resource, action, instance?)`  | `Promise<void>`                     | Throws `AuthorizationDeniedError` when denied  |
| `explain(resource, action, instance?)` | `Promise<AuthorizationExplanation>` | Decision plus the grants evaluated to reach it |
| `allowedActions(resource, instance?)`  | `Promise<Action[]>`                 | Declared actions allowed for this session      |

### Errors

All errors extend `AuthorizationError` and expose a `code`:

| Error                              | Code                                  |
| ---------------------------------- | ------------------------------------- |
| `UnknownRoleError`                 | `AUTHZ_UNKNOWN_ROLE`                  |
| `CircularRoleInheritanceError`     | `AUTHZ_CIRCULAR_ROLE_INHERITANCE`     |
| `AuthorizationDeniedError`         | `AUTHZ_DENIED`                        |
| `InvalidPermissionDefinitionError` | `AUTHZ_INVALID_PERMISSION_DEFINITION` |

See [SPEC.md](./SPEC.md) for the full normative specification.

## Development

```bash
pnpm install
pnpm dev          # tsup in watch mode
pnpm test:watch   # vitest in watch mode
pnpm verify       # format + typecheck + test + build + lint:package
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the PR checklist.

## License

MIT
