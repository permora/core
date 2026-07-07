/**
 * Type-safe authorization engine based on scopes, roles, inheritance,
 * permissions and dynamic conditions. Framework-agnostic, default deny.
 *
 * @packageDocumentation
 */

export { createAuthorization, Authorization } from './authorization';

export { defineResources } from './resources';
export type {
  ActionOf,
  InstanceOf,
  ResourceConfig,
  ResourceName,
  ResourcesShape,
} from './resources';

export { definePermissions, DEFAULT_SCOPE } from './permissions';
export type {
  Condition,
  ConditionInput,
  DefinedPermissions,
  Permission,
  PermissionsShape,
  RoleDefinition,
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
