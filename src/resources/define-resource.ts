import type { ResourceCondition, ResourceConditionFn } from './resource.types';

type DefineResourceOptions<Subject, Resource, Context> = {
  readonly conditions?: Readonly<
    Record<string, ResourceCondition<Subject, Resource, Context>>
  >;
};

type DefinedResource<Actions extends readonly string[], Resource> = {
  readonly actions: Actions;
  readonly resource: Resource;
  readonly conditions?: Readonly<Record<string, ResourceConditionFn>>;
};

type ResourceBuilder<Resource, Subject, Context> = {
  actions: <const Actions extends readonly string[]>(
    actions: Actions,
    options?: DefineResourceOptions<Subject, Resource, Context>,
  ) => DefinedResource<Actions, Resource>;
};

/**
 * Declares a single protected resource: valid actions and the TypeScript
 * type of its runtime instances.
 *
 * Fluent so that `defineResource<Project>().actions([...])` keeps action
 * string literals (TypeScript cannot infer a later type parameter when an
 * earlier one is provided explicitly).
 *
 * The `resource` field carries only phantom type information; its value is
 * never read at runtime.
 *
 * Named `conditions` are opaque string ids resolved at compile/rehydrate time.
 * They are required for portable sessions (`session.toPortable()`).
 *
 * @example
 * const resources = defineResources({
 *   project: defineResource<Project>().actions(['read', 'update', 'delete'], {
 *     conditions: {
 *       'owner-only': ({ subject, resource }) =>
 *         resource.ownerId === subject.id,
 *     },
 *   }),
 * });
 */
export function defineResource<
  Resource,
  Subject = unknown,
  Context = unknown,
>(): ResourceBuilder<Resource, Subject, Context> {
  return {
    actions: (actions, options) => ({
      actions,
      resource: undefined as unknown as Resource,
      ...(options?.conditions !== undefined
        ? {
            conditions: options.conditions as Readonly<
              Record<string, ResourceConditionFn>
            >,
          }
        : {}),
    }),
  };
}
