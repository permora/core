import type { ResourcesShape } from './resource.types';

/**
 * Declares the protected resource types, their valid actions and the
 * TypeScript type of their runtime instances.
 *
 * The `const` type parameter preserves action string literals without
 * requiring `as const` at the call site.
 *
 * @example
 * export const ResourceNames = {
 *   Project: 'project',
 *   Invoice: 'invoice',
 * } as const;
 *
 * const resources = defineResources({
 *   [ResourceNames.Project]: defineResource<Project>().actions([
 *     'create',
 *     'read',
 *     'update',
 *     'delete',
 *   ]),
 *   [ResourceNames.Invoice]: defineResource<Invoice>().actions([
 *     'read',
 *     'approve',
 *   ]),
 * });
 */
export function defineResources<const Resources extends ResourcesShape>(
  resources: Resources,
): Resources {
  return resources;
}
