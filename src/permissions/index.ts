export { DEFAULT_SCOPE } from './constants';
export type { DefaultScope } from './constants';
export { definePermissionInterpreter } from './define-permission-interpreter';
export { definePermissions } from './define-permissions';
export type {
  InterpretingBuilder,
  PermissionsForSubject,
  PermissionsWithResources,
} from './define-permissions';
export type {
  Condition,
  ConditionInput,
  DefinedPermissions,
  NestedScopedPermissionsInput,
  Permission,
  PermissionsMeta,
  PermissionsMetaOf,
  PermissionsMode,
  PermissionsShape,
  RoleDefinition,
  RoleMap,
  ScopedPermissionsInput,
  SingleTenantPermissionsInput,
} from './permission.types';
export type {
  InterpretContext,
  PermissionDefinitionInterpreter,
} from './permission-interpreter.types';
