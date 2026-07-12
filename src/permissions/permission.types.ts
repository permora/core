import type {
  ActionOf,
  InstanceOf,
  ResourceName,
  ResourcesShape,
} from '../resources/resource.types';

/**
 * Input received by a permission condition.
 */
export type ConditionInput<Subject, Scope, Resource, Context> = {
  subject: Subject;
  scope: Scope;
  resource: Resource;
  context: Context;
};

/**
 * Sync predicate attached to a permission.
 */
export type Condition<Subject, Scope, Resource, Context> = (
  input: ConditionInput<Subject, Scope, Resource, Context>,
) => boolean;

/**
 * A permission grants an action (or every action, via `"*"`) over a
 * resource, optionally guarded by a `when` condition or a named `condition`
 * id from `defineResource(...).actions(..., { conditions })`.
 *
 * `when` and `condition` are mutually exclusive. Only named `condition`
 * ids are portable via `session.toPortable()`.
 */
export type Permission<
  Action extends string,
  Subject,
  Scope,
  Resource,
  Context,
> =
  | Action
  | '*'
  | {
      readonly action: Action | '*';
      readonly when?: Condition<Subject, Scope, Resource, Context>;
    }
  | {
      readonly action: Action | '*';
      readonly condition: string;
    };

/**
 * Definition of a role: optional parent roles plus permissions per resource.
 */
export type RoleDefinition<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  readonly extends?: readonly string[];
} & {
  readonly [Name in ResourceName<Resources>]?: readonly Permission<
    ActionOf<Resources, Name>,
    Subject,
    string,
    InstanceOf<Resources, Name>,
    Context
  >[];
};

/**
 * Map of role name → role definition (single-tenant input shape).
 */
export type RoleMap<Resources extends ResourcesShape, Subject, Context> = {
  readonly [role: string]: RoleDefinition<Resources, Subject, Context>;
};

/**
 * Canonical internal shape: scope → role → role definition.
 */
export type PermissionsShape<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  readonly [scope: string]: RoleMap<Resources, Subject, Context>;
};

/**
 * Nested scope tree accepted by `scopedPermissions({ nested: true })`.
 * Intermediate nodes are nested scope segments; leaves are role maps.
 *
 * Top-level values must be objects whose values are role maps or further
 * nesting — not a bare {@link RoleMap}. That keeps flat `scope → roles`
 * input on the {@link PermissionsShape} overload so `when` stays contextual.
 */
export type NestedScopedPermissionsInput<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  readonly [key: string]: {
    readonly [key: string]:
      | RoleMap<Resources, Subject, Context>
      | NestedScopedPermissionsInput<Resources, Subject, Context>;
  };
};

/**
 * Input accepted by `.with(scopedPermissions()).from(...)` for scoped apps:
 * flat `scope → roles` or a nested scope tree.
 */
export type ScopedPermissionsInput<
  Resources extends ResourcesShape,
  Subject,
  Context,
> =
  | PermissionsShape<Resources, Subject, Context>
  | NestedScopedPermissionsInput<Resources, Subject, Context>;

/**
 * Default input of `.from(...)` for single-tenant apps.
 */
export type SingleTenantPermissionsInput<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = RoleMap<Resources, Subject, Context>;

export type PermissionsMode = 'single-tenant' | 'scoped';

declare const permissionsMeta: unique symbol;

/**
 * Phantom metadata carried by `DefinedPermissions` for session type inference.
 */
export type PermissionsMeta<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Mode extends PermissionsMode,
  Defs extends PermissionsShape<Resources, Subject, Context>,
> = {
  readonly resources: Resources;
  readonly subject: Subject;
  readonly context: Context;
  readonly mode: Mode;
  readonly defs: Defs;
};

/**
 * Result of `definePermissions()`. At runtime it is the canonical
 * `scope → role → roleDefinition` object; the phantom `permissionsMeta`
 * property carries type metadata for `createAuthorization()`.
 */
export type DefinedPermissions<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Defs extends PermissionsShape<Resources, Subject, Context>,
  Mode extends PermissionsMode = 'scoped',
> = Defs & {
  readonly [permissionsMeta]?: PermissionsMeta<
    Resources,
    Subject,
    Context,
    Mode,
    Defs
  >;
};

/**
 * Extracts type metadata back out of a `DefinedPermissions` value.
 */
export type PermissionsMetaOf<P> = P extends {
  readonly [permissionsMeta]?: infer Meta | undefined;
}
  ? NonNullable<Meta>
  : never;
