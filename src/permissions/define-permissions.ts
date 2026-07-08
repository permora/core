import { validateDefinition } from '../authorization/validate-definition';
import type { AnyPermissionsDefinition } from '../roles/role.types';
import type { ResourcesShape } from '../resources/resource.types';
import { DEFAULT_SCOPE } from './constants';
import type { DefinePermissionsOptions } from './permission-interpreter.types';
import type {
  DefinedPermissions,
  PermissionsShape,
  RoleMap,
} from './permission.types';

type SingleTenantCanonical<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Defs extends RoleMap<Resources, Subject, Context>,
> = {
  readonly '*': Defs;
};

type DefinePermissionsApply<Subject, Context> = {
  <
    const Resources extends ResourcesShape,
    Input,
  >(
    resources: Resources,
    input: Input,
    options: DefinePermissionsOptions<Input, Resources, Subject, Context>,
  ): DefinedPermissions<
    Resources,
    Subject,
    Context,
    PermissionsShape<Resources, Subject, Context>,
    'scoped'
  >;
  <
    const Resources extends ResourcesShape,
    const Defs extends RoleMap<Resources, Subject, Context>,
  >(
    resources: Resources,
    definitions: Defs,
  ): DefinedPermissions<
    Resources,
    Subject,
    Context,
    SingleTenantCanonical<Resources, Subject, Context, Defs>,
    'single-tenant'
  >;
};

/**
 * Builder returned by `definePermissions<Subject, Context>()`.
 * Apply it with resources and role definitions (and an optional resolver).
 */
export type PermissionBuilder<
  Subject,
  Context = undefined,
> = DefinePermissionsApply<Subject, Context>;

/**
 * Creates a permission builder for the given subject (and optional context).
 *
 * Single-tenant apps pass roles directly (no scope wrapper). The definition
 * is normalized internally to `{ '*': roleMap }`.
 *
 * Multi-tenant apps pass `{ resolver: scopedPermissions() }` from
 * `@permora/core/scoped` as the third argument.
 *
 * @example
 * const permissionBuilder = definePermissions<User>();
 * const permissions = permissionBuilder(resources, {
 *   viewer: { project: ['read'] },
 *   editor: {
 *     extends: ['viewer'],
 *     project: ['update'],
 *   },
 * });
 *
 * @example
 * const permissionBuilder = definePermissions<User>();
 * const permissions = permissionBuilder(
 *   resources,
 *   { acme: { viewer: { project: ['read'] } } },
 *   { resolver },
 * );
 */
export function definePermissions<
  Subject,
  Context = undefined,
>(): PermissionBuilder<Subject, Context> {
  const apply = <
    const Resources extends ResourcesShape,
    Input,
  >(
    resources: Resources,
    input: Input,
    options?: DefinePermissionsOptions<Input, Resources, Subject, Context>,
  ):
    | DefinedPermissions<
        Resources,
        Subject,
        Context,
        SingleTenantCanonical<
          Resources,
          Subject,
          Context,
          RoleMap<Resources, Subject, Context>
        >,
        'single-tenant'
      >
    | DefinedPermissions<
        Resources,
        Subject,
        Context,
        PermissionsShape<Resources, Subject, Context>,
        'scoped'
      > => {
    if (options?.resolver) {
      const definitions = options.resolver.interpret(input, { resources });
      validateDefinition(resources, definitions as AnyPermissionsDefinition);
      return definitions as DefinedPermissions<
        Resources,
        Subject,
        Context,
        PermissionsShape<Resources, Subject, Context>,
        'scoped'
      >;
    }

    const canonical = { [DEFAULT_SCOPE]: input };
    return canonical as DefinedPermissions<
      Resources,
      Subject,
      Context,
      SingleTenantCanonical<
        Resources,
        Subject,
        Context,
        RoleMap<Resources, Subject, Context>
      >,
      'single-tenant'
    >;
  };

  return apply as DefinePermissionsApply<Subject, Context>;
}
