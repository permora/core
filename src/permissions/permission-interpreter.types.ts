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
 *
 * `interpret` uses method syntax so parameter types are checked bivariantly,
 * allowing interpreters typed with a concrete `Input` to be passed to
 * `.with(interpreter)` without forcing `Input` to widen.
 */
export type PermissionDefinitionInterpreter<
  Input,
  Resources extends ResourcesShape = ResourcesShape,
  Subject = unknown,
  Context = undefined,
> = {
  readonly name?: string;
  interpret(
    input: Input,
    context: InterpretContext<Resources>,
  ): PermissionsShape<Resources, Subject, Context> | Record<string, unknown>;
};
