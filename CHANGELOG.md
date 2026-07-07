# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Type-safe authorization engine: `defineResources`, `definePermissions` and `createAuthorization`
- Scoped roles with per-role fallback to the default scope `*` and full override semantics
- Transitive role inheritance with cycle detection (`CircularRoleInheritanceError`)
- Conditional permissions via sync/async `when` predicates and wildcard actions (`"*"`)
- `AuthorizationSession` API: `can`, `cannot`, `assert`, `explain` and `allowedActions`
- Partial session compilation with local grant index (O(1) candidate lookup)
- Error hierarchy with stable codes (`AUTHZ_UNKNOWN_ROLE`, `AUTHZ_CIRCULAR_ROLE_INHERITANCE`, `AUTHZ_DENIED`, `AUTHZ_INVALID_PERMISSION_DEFINITION`)
- Observer plugins via `definePlugin` and `createAuthorization({ plugins })` with hooks: `onSessionCreate`, `onEvaluationStart`, `onGrantEvaluation`, `onEvaluationEnd`, `onGranted`, `onDenied`
