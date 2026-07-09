/**
 * Type-safe authorization engine based on scopes, roles, inheritance,
 * permissions and dynamic conditions. Framework-agnostic, default deny.
 *
 * @packageDocumentation
 */

export { createAuthorization, Authorization } from './authorization';

export { definePlugin } from './plugins';
export type {
  AuthorizationPlugin,
  DeniedContext,
  EvaluationEndContext,
  EvaluationStartContext,
  EvaluatedGrantSnapshot,
  GrantedContext,
  GrantEvaluationContext,
  SessionCreateContext,
} from './plugins';

export { defineResource, defineResources } from './resources';
export type {
  ActionOf,
  InstanceOf,
  ResourceConfig,
  ResourceConfigFor,
  ResourceName,
  ResourcesShape,
} from './resources';

export {
  definePermissionInterpreter,
  definePermissions,
  DEFAULT_SCOPE,
} from './permissions';
export type {
  Condition,
  ConditionInput,
  DefinedPermissions,
  InterpretContext,
  InterpretingBuilder,
  NestedScopedPermissionsInput,
  Permission,
  PermissionDefinitionInterpreter,
  PermissionsForSubject,
  PermissionsMeta,
  PermissionsMetaOf,
  PermissionsMode,
  PermissionsShape,
  PermissionsWithResources,
  RoleDefinition,
  RoleMap,
  ScopedPermissionsInput,
  SingleTenantPermissionsInput,
} from './permissions';

export { AuthorizationSession } from './session';
export type {
  AuthorizationExplanation,
  PermissionGraphEntry,
  PermissionGraphRole,
  SessionInput,
  SessionPermissionGraph,
} from './session';

export type { EvaluationReason } from './evaluator';

export {
  AuthorizationDeniedError,
  AuthorizationError,
  CircularRoleInheritanceError,
  InvalidPermissionDefinitionError,
  PortableInlineConditionError,
  PortableSessionError,
  PortableSessionInvalidError,
  PortableSessionStaleError,
  UnknownRoleError,
} from './errors';
export type { PortableStaleReason } from './errors';

export {
  DEFAULT_SCOPE_RESOLUTION,
  mergeRoleDefinitions,
  normalizeScopeResolution,
} from './roles';
export type { ScopeResolutionOptions } from './roles';

export {
  createSessionFromPortable,
  decodePortableSession,
  encodePortableSession,
  PORTABLE_SESSION_VERSION,
} from './portable';
export type {
  CompactPortableSession,
  CreateSessionFromPortableOptions,
  PortableGrant,
  PortableSession,
} from './portable';
