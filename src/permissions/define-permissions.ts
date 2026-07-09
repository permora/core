import { validateDefinition } from '../authorization/validate-definition';
import type { AnyPermissionsDefinition } from '../roles/role.types';
import type { ResourcesShape } from '../resources/resource.types';
import { DEFAULT_SCOPE } from './constants';
import type { PermissionDefinitionInterpreter } from './permission-interpreter.types';
import type {
  DefinedPermissions,
  NestedScopedPermissionsInput,
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

type ScopedDefinedPermissions<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = DefinedPermissions<
  Resources,
  Subject,
  Context,
  PermissionsShape<Resources, Subject, Context>,
  'scoped'
>;

/**
 * Builder after `.with(interpreter)`. Overloads keep `when` contextual for the
 * built-in scoped shapes; the generic `Input` covers custom interpreters.
 */
export type InterpretingBuilder<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Input,
> = {
  from: {
    (
      input: PermissionsShape<Resources, Subject, Context>,
    ): ScopedDefinedPermissions<Resources, Subject, Context>;
    (
      input: NestedScopedPermissionsInput<Resources, Subject, Context>,
    ): ScopedDefinedPermissions<Resources, Subject, Context>;
    (input: Input): ScopedDefinedPermissions<Resources, Subject, Context>;
  };
};

export type PermissionsForSubject<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  from: <const Defs extends RoleMap<Resources, Subject, Context>>(
    roles: Defs,
  ) => DefinedPermissions<
    Resources,
    Subject,
    Context,
    SingleTenantCanonical<Resources, Subject, Context, Defs>,
    'single-tenant'
  >;
  with: <Input>(
    interpreter: PermissionDefinitionInterpreter<
      Input,
      NoInfer<Resources>,
      Subject,
      Context
    >,
  ) => InterpretingBuilder<Resources, Subject, Context, Input>;
};

export type PermissionsWithResources<Resources extends ResourcesShape> = {
  forSubject: <Subject, Context = undefined>() => PermissionsForSubject<
    Resources,
    Subject,
    Context
  >;
};

/**
 * Declares permissions for a resource registry.
 *
 * Resources are inferred from the value; Subject/Context are fixed in
 * `.forSubject()`. Single-tenant apps call `.from(roleMap)`. Multi-tenant
 * apps chain `.with(scopedPermissions()).from(input)` (import the interpreter
 * from `@permora/core/scoped`).
 *
 * @example
 * const permissions = definePermissions({ resources })
 *   .forSubject<User>()
 *   .from({
 *     viewer: { project: ['read'] },
 *     editor: {
 *       extends: ['viewer'],
 *       project: ['update'],
 *     },
 *   });
 *
 * @example
 * import { scopedPermissions } from '@permora/core/scoped';
 *
 * const permissions = definePermissions({ resources })
 *   .forSubject<User>()
 *   .with(scopedPermissions())
 *   .from({
 *     '*': { viewer: { project: ['read'] } },
 *     'org:acme': { admin: { project: ['*'] } },
 *   });
 */
export function definePermissions<
  const Resources extends ResourcesShape,
>(options: {
  readonly resources: Resources;
}): PermissionsWithResources<Resources> {
  const { resources } = options;

  return {
    forSubject: <Subject, Context = undefined>() =>
      ({
        from: <const Defs extends RoleMap<Resources, Subject, Context>>(
          roles: Defs,
        ) =>
          ({ [DEFAULT_SCOPE]: roles }) as DefinedPermissions<
            Resources,
            Subject,
            Context,
            SingleTenantCanonical<Resources, Subject, Context, Defs>,
            'single-tenant'
          >,
        with: <Input>(
          interpreter: PermissionDefinitionInterpreter<
            Input,
            NoInfer<Resources>,
            Subject,
            Context
          >,
        ) =>
          ({
            from: (input: Input) => {
              const definitions = interpreter.interpret(input, { resources });
              validateDefinition(
                resources,
                definitions as AnyPermissionsDefinition,
              );
              return definitions as ScopedDefinedPermissions<
                Resources,
                Subject,
                Context
              >;
            },
          }) as InterpretingBuilder<Resources, Subject, Context, Input>,
      }) as PermissionsForSubject<Resources, Subject, Context>,
  };
}
