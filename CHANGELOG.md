# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Type-safe authorization engine: `defineResources`, `definePermissions` and `createAuthorization`
- `defineResource<Resource>()` to declare a resource with typed actions and instance type without `resource: {} as T`
- Exported `PermissionBuilder<Subject, Context>` type for the two-step permission definition flow
- Curried `definePermissions<Subject, Context>()` factory returning a builder applied with `(resources, definitions)` or `(resources, input, { resolver })`
- Single-tenant permissions: pass roles directly (no `*` scope wrapper); normalized internally to `{ '*': roleMap }`
- Permission definition interpreters via `definePermissionInterpreter` and `definePermissions(..., { resolver })` for custom input formats at definition time
- Tree-shakeable `@permora/core/scoped` subpath with `scopedPermissions()` for multi-tenant scope resolution (flat and nested scope trees)
- `scopedPermissions({ separator })` option to customize how nested scope segments are joined (default `':'`; e.g. `org__staging` with `separator: '__'`)
- Scoped roles with per-role fallback to the default scope `*` and full override semantics
- Transitive role inheritance with cycle detection (`CircularRoleInheritanceError`)
- Conditional permissions via sync/async `when` predicates and wildcard actions (`"*"`)
- `AuthorizationSession` API: `can`, `cannot`, `assert`, `explain` and `allowedActions`
- Partial session compilation with local grant index (O(1) candidate lookup)
- Error hierarchy with stable codes (`AUTHZ_UNKNOWN_ROLE`, `AUTHZ_CIRCULAR_ROLE_INHERITANCE`, `AUTHZ_DENIED`, `AUTHZ_INVALID_PERMISSION_DEFINITION`)
- Observer plugins via `definePlugin` and `createAuthorization({ plugins })` with hooks: `onSessionCreate`, `onEvaluationStart`, `onGrantEvaluation`, `onEvaluationEnd`, `onGranted`, `onDenied`
- `ResourceConfigFor<Resource>` helper type; documentation for strongly typed resource names using `as const` maps or string enums
- `createAuthorization({ scopeResolution })` to control scoped role resolution: `fallback` (per-role fallback to `*`, default `true`) and `merge` (combine `*.role` with `scope.role` when both exist, default `false`)
- `ScopeResolutionOptions`, `DEFAULT_SCOPE_RESOLUTION`, `mergeRoleDefinitions` and `normalizeScopeResolution` exports for scoped resolution tooling

### Changed

- `definePermissions` is now a generic factory (`definePermissions<User>()`) rather than accepting `resources` as its first runtime argument in a single call
- README and SPEC examples updated for the builder pattern, `defineResource`, and typed resource name conventions
- `scopedPermissions({ separator })` is only applied when `nested: true`; in flat mode scope keys must be written exactly as they appear at runtime
- `UnknownRoleError` message omits the default-scope fallback hint when `scopeResolution.fallback` is `false`

### Deprecated

- Manual `resource: {} as T` in `defineResources` entries — still supported; prefer `defineResource<T>({ actions })`
