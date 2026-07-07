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
 * Sync or async predicate attached to a permission.
 */
export type Condition<Subject, Scope, Resource, Context> = (
  input: ConditionInput<Subject, Scope, Resource, Context>,
) => boolean | Promise<boolean>;

/**
 * A permission grants an action (or every action, via `"*"`) over a
 * resource, optionally guarded by a `when` condition.
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
 * Shape accepted by `definePermissions()`: scope → role → role definition.
 */
export type PermissionsShape<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  readonly [scope: string]: {
    readonly [role: string]: RoleDefinition<Resources, Subject, Context>;
  };
};

declare const permissionsMeta: unique symbol;

/**
 * Result of `definePermissions()`. At runtime it is exactly the definition
 * object; the phantom `permissionsMeta` property carries the `Resources`,
 * `Subject` and `Context` types so `createAuthorization()` can recover them.
 */
export type DefinedPermissions<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Defs extends PermissionsShape<Resources, Subject, Context>,
> = Defs & {
  readonly [permissionsMeta]?: {
    resources: Resources;
    subject: Subject;
    context: Context;
  };
};

/**
 * Extracts type metadata back out of a `DefinedPermissions` value.
 */
export type PermissionsMetaOf<P> = P extends {
  readonly [permissionsMeta]?: infer Meta | undefined;
}
  ? NonNullable<Meta>
  : never;
