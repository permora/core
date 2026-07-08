import type { ResourcesShape } from '../resources/resource.types';
import type { PermissionsShape } from './permission.types';

/**
 * Context passed to a permission definition interpreter.
 */
export type InterpretContext<Resources extends ResourcesShape> = {
  readonly resources: Resources;
};

/**
 * Transforms a custom permission input into the canonical
 * `scope → role → roleDefinition` shape.
 */
export type PermissionDefinitionInterpreter<
  Input,
  Resources extends ResourcesShape = ResourcesShape,
  Subject = unknown,
  Context = undefined,
> = {
  readonly name?: string;
  readonly interpret: (
    input: Input,
    context: InterpretContext<Resources>,
  ) => PermissionsShape<Resources, Subject, Context>;
};

/**
 * Options for `definePermissions()` when using a custom input resolver.
 *
 * `interpret` uses method syntax so parameter types are checked bivariantly,
 * allowing resolvers typed with a concrete `Input` to be passed when
 * `definePermissions<Subject>()(resources, input, { resolver })` leaves
 * `Input` at its default when the resolver uses method syntax.
 */
export type DefinePermissionsOptions<
  Input,
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  readonly resolver: {
    readonly name?: string;
    interpret(
      input: Input,
      context: InterpretContext<Resources>,
    ): PermissionsShape<Resources, Subject, Context> | Record<string, unknown>;
  };
};
