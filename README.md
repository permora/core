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
- **Single-tenant by default**: define roles directly — no scope wrapper required
- **Scopes (multi-tenant)**: opt-in via `@permora/core/scoped` — tenant namespaces (`*`, `org:acme`, `project:123`) with per-role fallback
- **Role inheritance**: transitive `extends` with cycle detection, resolved per scope
- **Conditions**: sync or async `when` predicates receiving `{ subject, scope, resource, context }`; named `condition` ids on resources for portable sessions
- **Wildcard actions**: `["*"]` grants every declared action of a resource
- **Explainability**: `session.explain()` reports which grant or condition decided
- **Partial compilation**: sessions only compile the roles they can reach — O(reachable roles + permissions)
- **Permission definition interpreters**: extend how permissions are declared via `.with(interpreter).from(input)`
- **Observer plugins**: audit, logging, metrics and tracing via `definePlugin` hooks without altering decisions

### Scopes (multi-tenant)

Single-tenant apps use `definePermissions()` with roles only — see [Usage](#usage). Multi-tenant apps import `scopedPermissions` from `@permora/core/scoped` (tree-shakeable subpath).

Defining a role in a specific scope uses **only** that definition — there is no merge with `*`, and permissions are not borrowed per resource from the default scope.

Resolution follows:

```text
permissions[scope]?.[role] ?? permissions["*"]?.[role]
```

Fallback to `*` happens **per role name**: if `org:acme` has no `viewer`, `*.viewer` is used. If `org:acme` **does** define `admin`, the entire `*.admin` definition is ignored.

**Common mistake** — assuming a scoped role adds permissions on top of the default:

```typescript
{
  '*': {
    admin: { user: ['read'] },
  },
  'org:arasaka': {
    admin: { invoice: ['approve'] }, // replaces *.admin entirely
  },
}
```

A session with `scope: 'org:arasaka'` and `roles: ['admin']` gets `invoice:approve` only — not `user:read`.

**Safe patterns:**

- Omit the role from the scope when the `*` definition is enough.
- Use `extends` with a distinct base role name (avoid `admin extends admin` cycles).
- Repeat permissions explicitly when a scoped override is intentional.

#### Scope resolution

By default, scoped resolution uses per-role fallback to `*` and full override when a role exists in both scopes (see above). Configure this at engine creation via `createAuthorization({ scopeResolution })`:

```typescript
const authz = createAuthorization({
  resources,
  permissions,
  scopeResolution: {
    fallback: true, // default — use *.role when missing in session scope
    merge: false, // default — specific role replaces *.role entirely
  },
});
```

| `fallback` | `merge` | Behavior                                                            |
| ---------- | ------- | ------------------------------------------------------------------- |
| `true`     | `false` | Default — per-role fallback; specific replaces `*` entirely         |
| `true`     | `true`  | Fallback when absent; merge `*.role` + `scope.role` when both exist |
| `false`    | `false` | Strict — only roles defined in the session scope                    |
| `false`    | `true`  | No fallback; merge when both exist in the session scope             |

```typescript
// Strict: roles must be defined in the tenant scope
createAuthorization({
  resources,
  permissions,
  scopeResolution: { fallback: false },
});

// Merge: combine default + scoped admin definitions
createAuthorization({
  resources,
  permissions,
  scopeResolution: { merge: true },
});
```

When `merge: true`, `extends` and permission arrays are combined (OR semantics at evaluation). Parent roles referenced via merged `extends` are still resolved with the same `scopeResolution` flags.

Normative details in [SPEC.md](./SPEC.md) (sections 8–9).

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
  defineResource,
  defineResources,
} from '@permora/core';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .from({
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
  });

const authz = createAuthorization({ resources, permissions });

const session = authz.session({
  subject: { id: 'user_123', approvalLimit: 10_000 },
  roles: ['editor'],
});

await session.can('project', 'read'); // true (editor → viewer)
await session.can('project', 'delete', project); // true when owner
await session.assert('invoice', 'approve', invoice); // throws AuthorizationDeniedError
await session.explain('project', 'delete', project); // { allowed, grantedBy, reason, ... }
await session.allowedActions('project', project); // ['read', 'update', 'delete']
```

Single-tenant applications omit `scope` — sessions default to the implicit `*` scope.

### Strongly typed resource names

Use a single source of truth for resource name strings so `session.can()` and permission definitions stay in sync at compile time.

**Recommended —** `as const` **map:**

```typescript
export const ResourceNames = {
  Project: 'project',
  Invoice: 'invoice',
} as const;

const resources = defineResources({
  [ResourceNames.Project]: defineResource<Project>().actions([
    'read',
    'update',
    'delete',
  ]),
  [ResourceNames.Invoice]: defineResource<Invoice>().actions([
    'read',
    'approve',
  ]),
});

// ResourceName<typeof resources> === 'project' | 'invoice'
await session.can(ResourceNames.Project, 'read');
await session.can(ResourceNames.Invoice, 'approve', invoice);
```

**Alternative — string enum:**

```typescript
export enum ResourceName {
  Project = 'project',
  Invoice = 'invoice',
}

const resources = defineResources({
  [ResourceName.Project]: defineResource<Project>().actions(['read']),
  [ResourceName.Invoice]: defineResource<Invoice>().actions(['read']),
});
```

Prefer string enums over numeric enums (numeric enums break `keyof` inference). The `as const` map is generally preferable: no reverse mapping, better tree-shaking, and aligned with idiomatic TypeScript in this library.

The legacy `{ actions, resource: {} as T }` shape remains supported for backward compatibility.

### Multi-tenant

Import the scoped interpreter from the tree-shakeable subpath:

```typescript
import { scopedPermissions } from '@permora/core/scoped';

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
    },
    // org:acme.editor fully replaces *.editor (no merge)
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
```

Nested scope trees are supported via `scopedPermissions({ nested: true })`. Use `separator` to customize how segments are joined (only applies when `nested: true`):

```typescript
definePermissions({ resources })
  .forSubject<User>()
  .with(scopedPermissions({ nested: true, separator: '__' }))
  .from({
    arasaka: {
      staging: { admin: { invoice: ['create', 'read'] } },
    },
  });
// → canonical scope "arasaka__staging"
```

### Permission definition interpreters

Transform custom permission formats before the engine sees them. Interpreters run once at definition time (not per evaluation).

```typescript
import { definePermissionInterpreter, definePermissions } from '@permora/core';

const myInterpreter = definePermissionInterpreter({
  name: 'my-format',
  interpret(input, { resources }) {
    return toCanonicalShape(input); // scope → role → roleDefinition
  },
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .with(myInterpreter)
  .from(customInput);
```

|                   | Observer plugin (`definePlugin`)   | Definition interpreter (`definePermissionInterpreter`) |
| ----------------- | ---------------------------------- | ------------------------------------------------------ |
| Phase             | Evaluation (per check)             | Definition (once)                                      |
| Registration      | `createAuthorization({ plugins })` | `.with(interpreter).from(input)`                       |
| Alters decisions? | No                                 | Transforms input only                                  |

### Plugins (evaluation)

Observer plugins audit session creation and permission evaluation without changing ALLOW/DENY decisions. Register them on the engine:

```typescript
import { createAuthorization, definePlugin } from '@permora/core';

const audit = definePlugin({
  name: 'audit',
  onSessionCreate({ subject, scope, roles }) {
    /* session compiled */
  },
  onEvaluationStart({ resource, action }) {
    /* evaluation started */
  },
  onGrantEvaluation({ grant, matched }) {
    /* each grant candidate evaluated */
  },
  onEvaluationEnd({ allowed, reason, evaluatedGrants }) {
    /* evaluation finished */
  },
  onGranted({ grantedBy }) {
    /* allowed === true */
  },
  onDenied({ reason }) {
    /* allowed === false */
  },
});

const authz = createAuthorization({
  resources,
  permissions,
  plugins: [audit],
});
```

| Hook                | When                                                                         |
| ------------------- | ---------------------------------------------------------------------------- |
| `onSessionCreate`   | After `authz.session()` compiles the session                                 |
| `onEvaluationStart` | Start of each evaluation (`can`, `explain`, each action in `allowedActions`) |
| `onGrantEvaluation` | After each grant candidate is evaluated                                      |
| `onEvaluationEnd`   | End of each evaluation (allow or deny)                                       |
| `onGranted`         | When the evaluation result is allowed                                        |
| `onDenied`          | When the evaluation result is denied                                         |

Plugins are optional; omitting `plugins` has zero overhead. Errors thrown by plugins propagate to the caller during evaluation. `onSessionCreate` runs synchronously during `authz.session()`; async handlers are scheduled without blocking session creation.

### Portable sessions

Export a compiled snapshot as JSON and rehydrate it without recompiling the role graph. Useful when the consumer signs the payload (JWT) or caches authorization state.

```typescript
import {
  createSessionFromPortable,
  encodePortableSession,
  decodePortableSession,
} from '@permora/core';

// Named conditions on resources (required for portable export)
const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'delete'], {
    conditions: {
      'owner-only': ({ subject, resource }) => resource.ownerId === subject.id,
    },
  }),
});

// Permissions reference condition ids — not inline when
const permissions = definePermissions({ resources })
  .forSubject<User>()
  .from({
    editor: {
      project: [{ action: 'delete', condition: 'owner-only' }],
    },
  });

const portable = session.toPortable();
// { v: 1, scope, roles, subject, grants }

const restored = createSessionFromPortable(portable, {
  resources,
  context: requestContext,
});
```

| API                                                            | Description                                  |
| -------------------------------------------------------------- | -------------------------------------------- |
| `session.toPortable()`                                         | Export flat grants + subject + scope + roles |
| `createSessionFromPortable(portable, { resources, context? })` | Rehydrate `AuthorizationSession`             |
| `encodePortableSession` / `decodePortableSession`              | Compact tuple wire format                    |

**Not handled by the core:** JWT sign/verify, `exp`/`iat`, token storage, or refresh policy. Catch `PortableSessionStaleError` when the resources registry changed after deploy and regenerate the session from your authoritative source.

See [examples/09-portable-sessions.md](./examples/09-portable-sessions.md).

### Session API

| Method                                 | Returns                             | Description                                                                     |
| -------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------- |
| `can(resource, action, instance?)`     | `Promise<boolean>`                  | True when any grant allows the action                                           |
| `cannot(resource, action, instance?)`  | `Promise<boolean>`                  | Negation of `can`                                                               |
| `assert(resource, action, instance?)`  | `Promise<void>`                     | Throws `AuthorizationDeniedError` when denied                                   |
| `explain(resource, action, instance?)` | `Promise<AuthorizationExplanation>` | Decision plus the grants evaluated to reach it                                  |
| `allowedActions(resource, instance?)`  | `Promise<Action[]>`                 | Declared actions allowed for this session                                       |
| `permissionGraph()`                    | `SessionPermissionGraph`            | Reachable role graph and normalized permissions (sync; no condition evaluation) |
| `toPortable()`                         | `PortableSession`                   | JSON-friendly snapshot for transport (requires named `condition` ids)           |

### Errors

All errors extend `AuthorizationError` and expose a `code`:

| Error                              | Code                                  |
| ---------------------------------- | ------------------------------------- |
| `UnknownRoleError`                 | `AUTHZ_UNKNOWN_ROLE`                  |
| `CircularRoleInheritanceError`     | `AUTHZ_CIRCULAR_ROLE_INHERITANCE`     |
| `AuthorizationDeniedError`         | `AUTHZ_DENIED`                        |
| `InvalidPermissionDefinitionError` | `AUTHZ_INVALID_PERMISSION_DEFINITION` |
| `PortableInlineConditionError`     | `AUTHZ_PORTABLE_INLINE_CONDITION`     |
| `PortableSessionInvalidError`      | `AUTHZ_PORTABLE_SESSION_INVALID`      |
| `PortableSessionStaleError`        | `AUTHZ_PORTABLE_SESSION_STALE`        |

See [SPEC.md](./SPEC.md) for the full normative specification.

## Examples

Step-by-step configuration guides with expected behavior:

[examples/](examples/) — `00-getting-started.md` through `09-portable-sessions.md`

End-to-end scenario tests mirroring each guide live in `[test/e2e/](test/e2e/)`.

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
