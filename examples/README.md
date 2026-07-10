# Examples

Step-by-step guides for configuring `@permora/core` and the behavior you should expect at runtime. Each file includes a **configuration**, **session inputs**, and **expected outcomes**.

Each guide has a corresponding end-to-end test in [`test/e2e/`](../test/e2e/) (e.g. `examples/00-getting-started.md` → `test/e2e/00-getting-started.test.ts`).

## Reading order

| #   | Guide                                                                | Topic                                                       |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------- |
| 00  | [getting-started](./00-getting-started.md)                           | Single-tenant setup, default deny, `can` / `assert`         |
| 01  | [scoped](./01-scoped.md)                                             | Multi-tenant scopes, fallback, override                     |
| 02  | [fallbacks-and-merge](./02-fallbacks-and-merge.md)                   | `scopeResolution` flags                                     |
| 03  | [inheritance](./03-inheritance.md)                                   | `extends`, transitive roles, cycles                         |
| 04  | [conditions](./04-conditions.md)                                     | `when` predicates, denial reasons                           |
| 05  | [wildcards](./05-wildcards.md)                                       | `action: "*"` grants                                        |
| 06  | [explain-and-permission-graph](./06-explain-and-permission-graph.md) | Introspection APIs                                          |
| 07  | [nested-scopes](./07-nested-scopes.md)                               | Nested scope trees, `separator`                             |
| 08  | [plugins](./08-plugins.md)                                           | Observer plugins for audit and metrics                      |
| 09  | [portable-sessions](./09-portable-sessions.md)                       | `toPortable`, `createSessionFromPortable`, named conditions |

## Conventions

- **allow** — `session.can(...)` resolves to `true`
- **deny** — `session.can(...)` resolves to `false` (default deny)
- **throws** — synchronous error during `authz.session()` or `session.assert()`
- Resource instances are omitted when the grant has no `when` condition
