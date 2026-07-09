# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Type-safe authorization engine: `defineResources`, `definePermissions` and `createAuthorization`
- `defineResource<Resource>().actions([...], options?)` to declare a resource with typed actions and instance type without `resource: {} as T`
- Fluent `definePermissions({ resources }).forSubject<Subject, Context>()` builder with `.from(roles)` (single-tenant) and `.with(interpreter).from(input)` (interpreters / multi-tenant)
- Exported builder types: `PermissionsWithResources`, `PermissionsForSubject`, `InterpretingBuilder`
- Single-tenant permissions: pass roles directly (no `*` scope wrapper); normalized internally to `{ '*': roleMap }`
- Permission definition interpreters via `definePermissionInterpreter` and `.with(interpreter).from(input)` for custom input formats at definition time
- Tree-shakeable `@permora/core/scoped` subpath with `scopedPermissions()` for multi-tenant scope resolution (flat and nested scope trees)
- `scopedPermissions({ separator })` option to customize how nested scope segments are joined (default `':'`; e.g. `org__staging` with `separator: '__'`)
- Scoped roles with per-role fallback to the default scope `*` and full override semantics
- Transitive role inheritance with cycle detection (`CircularRoleInheritanceError`)
- Conditional permissions via sync/async `when` predicates and wildcard actions (`"*"`)
- `AuthorizationSession` API: `can`, `cannot`, `assert`, `explain`, `allowedActions` and `permissionGraph`
- Partial session compilation with local grant index (O(1) candidate lookup)
- Error hierarchy with stable codes (`AUTHZ_UNKNOWN_ROLE`, `AUTHZ_CIRCULAR_ROLE_INHERITANCE`, `AUTHZ_DENIED`, `AUTHZ_INVALID_PERMISSION_DEFINITION`)
- Observer plugins via `definePlugin` and `createAuthorization({ plugins })` with hooks: `onSessionCreate`, `onEvaluationStart`, `onGrantEvaluation`, `onEvaluationEnd`, `onGranted`, `onDenied`
- `ResourceConfigFor<Resource>` helper type; documentation for strongly typed resource names using `as const` maps or string enums
- `createAuthorization({ scopeResolution })` to control scoped role resolution: `fallback` (per-role fallback to `*`, default `true`) and `merge` (combine `*.role` with `scope.role` when both exist, default `false`)
- `ScopeResolutionOptions`, `DEFAULT_SCOPE_RESOLUTION`, `mergeRoleDefinitions` and `normalizeScopeResolution` exports for scoped resolution tooling
- `session.permissionGraph()` — synchronous snapshot of the reachable role graph and normalized permissions (`SessionPermissionGraph`, `PermissionGraphRole`, `PermissionGraphEntry`)
- Named resource conditions via `defineResource(...).actions(..., { conditions })` and `{ action, condition: '<id>' }` permissions for portable serialization
- Portable sessions: `session.toPortable()`, `createSessionFromPortable()`, `encodePortableSession()` / `decodePortableSession()`
- Portable error types: `PortableInlineConditionError`, `PortableSessionInvalidError`, `PortableSessionStaleError`
- Step-by-step guides in `examples/00`–`09` with matching end-to-end tests in `test/e2e/`

### Changed

- `defineResource` is a fluent builder: `defineResource<T>().actions([...], options?)` (replaces the curried `defineResource<T>()({ actions })` form)
- `definePermissions` is a fluent builder: `definePermissions({ resources }).forSubject<S>().from(...)` / `.with(interpreter).from(...)` (replaces the curried `definePermissions<S>()(resources, ...)` form)
- Terminology standardized on **interpreter** (not resolver) for permission definition transforms; removed `PermissionResolver` and `DefinePermissionsOptions`
- `session.resolvedPermissions()` renamed to `session.permissionGraph()`; types `SessionPermissionGraph`, `PermissionGraphRole`, `PermissionGraphEntry` (replaces `SessionResolvedPermissions` / `ResolvedPermissionSnapshot` / `ResolvedPermissionEntry`)
- README and SPEC examples updated for the builder pattern, `defineResource`, and typed resource name conventions
- `scopedPermissions({ separator })` is only applied when `nested: true`; in flat mode scope keys must be written exactly as they appear at runtime
- `UnknownRoleError` message omits the default-scope fallback hint when `scopeResolution.fallback` is `false`

### Deprecated

- Manual `resource: {} as T` in `defineResources` entries — still supported; prefer `defineResource<T>().actions([...])`
