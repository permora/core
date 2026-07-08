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
  DefinePermissionsOptions,
  InterpretContext,
  Permission,
  PermissionBuilder,
  PermissionDefinitionInterpreter,
  PermissionsMeta,
  PermissionsMetaOf,
  PermissionsMode,
  PermissionsShape,
  RoleDefinition,
  RoleMap,
  SingleTenantPermissionsInput,
} from './permissions';

export { AuthorizationSession } from './session';
export type { AuthorizationExplanation, SessionInput } from './session';

export type { EvaluationReason } from './evaluator';

export {
  AuthorizationDeniedError,
  AuthorizationError,
  CircularRoleInheritanceError,
  InvalidPermissionDefinitionError,
  UnknownRoleError,
} from './errors';
