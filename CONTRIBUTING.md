# Contributing

Thank you for contributing to `@permora/core`.

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev          # tsup in watch mode
pnpm test:watch   # vitest in watch mode
```

## PR checklist

1. `pnpm typecheck` — no TypeScript errors
2. `pnpm format:check` — Prettier formatting
3. `pnpm test` — all tests passing
4. `pnpm build` — clean build
5. `pnpm lint:package` — publint + attw with no issues

Or run everything at once: `pnpm verify`

## API convention

- Exported functions: **lower camelCase** (`can`)
- Grouped objects: **UpperCamelCase** (`Permissions`)
- Object methods: camelCase (`can`)

```typescript
export function can(grants: readonly string[], required: string): boolean {
  /* ... */
}
export const Permissions = { can } as const;
```

## Releasing

Releases are automated via GitHub Actions. Do not bump `package.json` manually.

1. Document changes under `## [Unreleased]` in [CHANGELOG.md](./CHANGELOG.md)
2. Merge your changes to `main`
3. Go to **Actions → Bump and Release → Run workflow**
4. Choose `patch`, `minor`, or `major`

The workflow will bump the version, update CHANGELOG, create a GitHub Release, and publish to npm via [Trusted Publishing](https://docs.npmjs.com/trusted-publishers) (OIDC — no long-lived token).

### One-time setup

#### npmjs.com

1. **First publish** — if the package does not exist on npm yet, publish once manually or use an `NPM_TOKEN` secret until Trusted Publishing is configured
2. **Trusted Publisher** — `Packages → @permora/core → Settings → Trusted publishing → GitHub Actions`:

   | Field                | Value                  |
   | -------------------- | ---------------------- |
   | Organization or user | `cicerotcv`            |
   | Repository           | `permora`              |
   | Workflow filename    | `bump-and-release.yml` |
   | Environment name     | _(leave empty)_        |

3. Confirm `repository.url` in `package.json` matches your GitHub repo exactly

#### GitHub

- Repository must be **public** for automatic provenance
- Allow `github-actions[bot]` to push to `main` if branch protection is enabled

## Style

- Prettier for formatting
- Zero runtime dependencies
- TypeScript strict
- Comments only for non-obvious business logic
