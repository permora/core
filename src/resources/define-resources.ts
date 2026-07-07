import type { ResourcesShape } from './resource.types';

/**
 * Declares the protected resource types, their valid actions and the
 * TypeScript type of their runtime instances.
 *
 * The `const` type parameter preserves action string literals without
 * requiring `as const` at the call site.
 *
 * @example
 * const resources = defineResources({
 *   project: {
 *     actions: ['create', 'read', 'update', 'delete'],
 *     resource: {} as Project,
 *   },
 * });
 */
export function defineResources<const Resources extends ResourcesShape>(
  resources: Resources,
): Resources {
  return resources;
}
