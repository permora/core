import type {
  DefinedPermissions,
  PermissionsShape,
} from '../permissions/permission.types';
import type { ResourcesShape } from '../resources/resource.types';
import type { AnyPermissionsDefinition } from '../roles/role.types';
import { Authorization } from './authorization';
import { validateDefinition } from './validate-definition';

/**
 * Creates the authorization engine from a resources definition and a
 * permissions definition produced by `definePermissions()`.
 *
 * Eagerly validates cheap invariants (structure, known resources/actions,
 * wildcards); inheritance issues are detected lazily per session.
 */
export function createAuthorization<
  Resources extends ResourcesShape,
  Subject,
  Context,
  Defs extends PermissionsShape<Resources, Subject, Context>,
>(input: {
  resources: Resources;
  permissions: DefinedPermissions<Resources, Subject, Context, Defs>;
}): Authorization<Resources, Subject, Context, Defs> {
  const permissions = input.permissions as AnyPermissionsDefinition;

  validateDefinition(input.resources, permissions);

  return new Authorization<Resources, Subject, Context, Defs>(
    input.resources,
    permissions,
  );
}
