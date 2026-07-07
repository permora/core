import type { ResourcesShape } from '../resources/resource.types';
import type { DefinedPermissions, PermissionsShape } from './permission.types';

/**
 * Declares scoped role permissions with full type inference.
 *
 * The curried form exists because TypeScript does not support partial
 * generic inference: `Subject` and `Context` are provided explicitly,
 * while `Resources` and the definition literal are inferred from the
 * arguments.
 *
 * The returned definition must be treated as immutable.
 *
 * @example
 * const permissions = definePermissions<User>()(resources, {
 *   '*': {
 *     viewer: { project: ['read'] },
 *     editor: {
 *       extends: ['viewer'],
 *       project: [
 *         'update',
 *         {
 *           action: 'delete',
 *           when: ({ subject, resource }) => resource.ownerId === subject.id,
 *         },
 *       ],
 *     },
 *   },
 * });
 */
export function definePermissions<Subject, Context = undefined>() {
  return function <
    const Resources extends ResourcesShape,
    const Defs extends PermissionsShape<Resources, Subject, Context>,
  >(
    resources: Resources,
    definitions: Defs,
  ): DefinedPermissions<Resources, Subject, Context, Defs> {
    void resources;
    return definitions as DefinedPermissions<Resources, Subject, Context, Defs>;
  };
}
