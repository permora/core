# Express Single-Tenant Example

This example shows a minimal Express API that uses the local `@permora/core`
package for:

- fake authentication via `Authorization: Bearer <token>`
- single-tenant authorization with the implicit default scope `*`
- `session.assert()` in middleware for 403 responses
- `session.explain()` for decision debugging

## Prerequisites

- Node.js 20+
- `pnpm`

## Install

Build the local `@permora/core` package first, because this example consumes
the built package via `file:../..` and the root package exports only `dist/`.

```bash
# from the repository root
pnpm build

# then install the example dependencies
cd examples/express-single-tenant
pnpm install
```

## Run

```bash
pnpm dev
```

The API starts on `http://localhost:3001`.

## Fake users

| User         | `userId` | Roles    | Token          |
| ------------ | -------- | -------- | -------------- |
| Alice Viewer | `u1`     | `viewer` | `token-viewer` |
| Bob Editor   | `u2`     | `editor` | `token-editor` |
| Carol Admin  | `u3`     | `admin`  | `token-admin`  |

## Auth flow

1. Call `POST /login` with a `userId`
2. Copy the returned token
3. Send `Authorization: Bearer <token>` on the protected routes

Example:

```bash
curl -X POST http://localhost:3001/login \
  -H 'content-type: application/json' \
  -d '{"userId":"u2"}'
```

## Routes

- `GET /health`
- `POST /login`
- `GET /me`
- `GET /posts`
- `POST /posts`
- `PATCH /posts/:id`
- `DELETE /posts/:id`
- `POST /posts/:id/publish`
- `GET /posts/:id/explain-delete`

## Example curls

### Viewer can read posts

```bash
curl http://localhost:3001/posts \
  -H 'Authorization: Bearer token-viewer'
```

### Editor can create posts

```bash
curl -X POST http://localhost:3001/posts \
  -H 'Authorization: Bearer token-editor' \
  -H 'content-type: application/json' \
  -d '{"title":"New editor post"}'
```

### Editor can delete only their own post

Owned post (`p1` belongs to `u2`):

```bash
curl -X DELETE http://localhost:3001/posts/p1 \
  -H 'Authorization: Bearer token-editor'
```

Not owned (`p2` belongs to `u1`):

```bash
curl -X DELETE http://localhost:3001/posts/p2 \
  -H 'Authorization: Bearer token-editor'
```

### Admin can publish any post

```bash
curl -X POST http://localhost:3001/posts/p2/publish \
  -H 'Authorization: Bearer token-admin'
```

### Explain a delete decision

```bash
curl http://localhost:3001/posts/p2/explain-delete \
  -H 'Authorization: Bearer token-editor'
```

## What the example demonstrates

- `defineResources()` and `definePermissions()` in `src/authz.ts`
- single-tenant `authz.session()` without passing `scope`
- inheritance: `editor -> viewer`
- wildcard: `admin -> ["*"]`
- conditional permission: editor can `delete` only when `post.authorId === subject.id`
- centralized authorization middleware using `session.assert()`
