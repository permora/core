export { collectRoleGraph } from './inheritance-resolver';
export { mergeRoleDefinitions } from './merge-role-definitions';
export { normalizeScopeResolution } from './normalize-scope-resolution';
export { resolveRole } from './role-resolver';
export type {
  AnyPermissionsDefinition,
  AnyRoleDefinition,
  ResolvedRole,
  ScopeResolutionOptions,
} from './role.types';
export { DEFAULT_SCOPE_RESOLUTION } from './role.types';
