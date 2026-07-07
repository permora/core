# @permora/core

![CI](https://github.com/cicerotcv/permora/actions/workflows/ci.yml/badge.svg?branch=main)
![node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![typescript](https://img.shields.io/badge/typescript-5.8-3178C6?logo=typescript&logoColor=white)
![tsup](https://img.shields.io/badge/tsup-8-FFEA00?logo=esbuild&logoColor=black)
![prettier](https://img.shields.io/badge/prettier-3-F7B93E?logo=prettier&logoColor=white)

TypeScript library for permission checks and management.

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
import { can } from '@permora/core';

const grants = ['posts:read', 'posts:write'];

can(grants, 'posts:read'); // true
can(grants, 'posts:delete'); // false
```

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
