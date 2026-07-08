/**
 * Declares a single protected resource: valid actions and the TypeScript
 * type of its runtime instances.
 *
 * The `resource` field carries only phantom type information; its value is
 * never read at runtime.
 *
 * @example
 * const resources = defineResources({
 *   project: defineResource<Project>({
 *     actions: ['read', 'update', 'delete'],
 *   }),
 * });
 */
export function defineResource<
  Resource,
  const Actions extends readonly string[] = readonly string[],
>(config: {
  readonly actions: Actions;
}): {
  readonly actions: Actions;
  readonly resource: Resource;
} {
  return {
    actions: config.actions,
    resource: undefined as unknown as Resource,
  };
}
