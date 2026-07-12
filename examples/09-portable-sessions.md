# Portable sessions

Export a compiled authorization snapshot as JSON, transport it through your app (JWT, cookie, header, etc.), and rehydrate it later without recompiling roles from the full permissions definition.

**Out of scope for** `@permora/core`**:** signing, verifying signatures, `exp`/`iat`, storage, and refresh policy. The core only defines the payload shape and semantic validation against `resources`.

## Named conditions

Portable grants cannot carry inline `when` functions. Register conditions on the resource and reference them by opaque id:

```typescript
import {
  createAuthorization,
  createSessionFromPortable,
  definePermissions,
  defineResource,
  defineResources,
} from '@permora/core';
import { scopedPermissions } from '@permora/core/scoped';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete'], {
    conditions: {
      'owner-only': ({ subject, resource }) => resource.ownerId === subject.id,
    },
  }),
  invoice: defineResource<Invoice>().actions(['read', 'approve'], {
    conditions: {
      'within-limit': ({ subject, resource }) =>
        resource.amount <= subject.approvalLimit,
    },
  }),
});

const permissions = definePermissions({ resources })
  .forSubject<User, Record<string, never>>()
  .with(scopedPermissions())
  .from({
    '*': {
      viewer: { project: ['read'] },
      editor: {
        extends: ['viewer'],
        project: ['update', { action: 'delete', condition: 'owner-only' }],
      },
    },
    'org:acme': {
      manager: {
        extends: ['editor'],
        invoice: ['read', { action: 'approve', condition: 'within-limit' }],
      },
    },
  });

const authz = createAuthorization({ resources, permissions });
```

`when` and `condition` are mutually exclusive. Inline `when` remains valid for server-only apps that never call `toPortable()`.

## Export

```typescript
const session = authz.session({
  subject: { id: 'user_123', approvalLimit: 10_000 },
  scope: 'org:acme',
  roles: ['manager'],
  context: {},
});

const portable = session.toPortable();
// { v: 1, scope, roles, subject, grants: [...] }
```

Each grant in `grants` is already flattened (inheritance resolved). Conditional grants include `condition: '<id>'`.

`toPortable()` throws `PortableInlineConditionError` when any reachable grant still uses inline `when`.

## Rehydrate

```typescript
const restored = createSessionFromPortable(portable, {
  resources,
  context: {}, // per-request; not stored in the portable payload
});

restored.can('invoice', 'approve', { id: 'i1', amount: 5_000 }); // allow
```

`createSessionFromPortable` validates every grant against the **current** `resources` registry:

| Failure                                   | Error                         | App action                 |
| ----------------------------------------- | ----------------------------- | -------------------------- |
| Malformed payload / unsupported `v`       | `PortableSessionInvalidError` | Reject request             |
| Unknown resource, action, or condition id | `PortableSessionStaleError`   | Regenerate session from DB |

This is **semantic** staleness (e.g. deploy removed a condition id). It is separate from transport expiration (e.g. JWT `exp`), which your app handles before calling `createSessionFromPortable`.

## Compact wire format

For smaller payloads, encode to a tuple with a string dictionary:

```typescript
import { encodePortableSession, decodePortableSession } from '@permora/core';

const compact = encodePortableSession(portable);
const decoded = decodePortableSession(compact);
```

No encryption or signing — only structural compression.

## JWT pattern (consumer responsibility)

```typescript
// issuance (server)
const portable = session.toPortable();
const token = await signJwt(portable, { expiresIn: '15m' });

// request (server or edge)
let portable: unknown;
try {
  portable = await verifyJwt(token); // exp enforced here
} catch {
  // try to regenerate the authz session
}

try {
  const session = createSessionFromPortable(portable, { resources, context });
  // use session.can / assert / explain
} catch (e) {
  if (e instanceof PortableSessionStaleError) {
    // Do something to regenerate the authz session
  }
  throw e;
}
```

Serialize `subject` however your transport layer requires. The core does not prescribe a subject wire format beyond JSON-compatible values.

## Expected outcomes

| Scenario                                           | Result                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| `toPortable()` after compile with named conditions | JSON payload with `v: 1` and flat `grants`                         |
| `createSessionFromPortable` + same `resources`     | Same `can()` results as the original session                       |
| Grant uses inline `when`                           | `toPortable()` **throws** `PortableInlineConditionError`           |
| Condition id removed after deploy                  | `createSessionFromPortable` **throws** `PortableSessionStaleError` |
| JWT expired                                        | Handled by your JWT library — core never sees the payload          |
