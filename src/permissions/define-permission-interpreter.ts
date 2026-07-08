import type { ResourcesShape } from '../resources/resource.types';
import type { PermissionDefinitionInterpreter } from './permission-interpreter.types';

/**
 * Declares a permission definition interpreter with optional `name` for debugging.
 *
 * @example
 * const nestedScopes = definePermissionInterpreter({
 *   name: 'nested-scopes',
 *   interpret(input) {
 *     return flattenNestedScopes(input);
 *   },
 * });
 */
export function definePermissionInterpreter<
  Input,
  Resources extends ResourcesShape = ResourcesShape,
  Subject = unknown,
  Context = undefined,
>(
  interpreter: PermissionDefinitionInterpreter<
    Input,
    Resources,
    Subject,
    Context
  >,
): PermissionDefinitionInterpreter<Input, Resources, Subject, Context> {
  return interpreter;
}
