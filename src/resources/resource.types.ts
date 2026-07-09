/**
 * Predicate registered on a resource under an opaque condition id.
 * Used by portable sessions to rehydrate `when` at runtime.
 */
export type ResourceCondition<Subject, Resource, Context> = (input: {
  subject: Subject;
  scope: string;
  resource: Resource;
  context: Context;
}) => boolean | Promise<boolean>;

/**
 * Erased condition signature stored on {@link ResourceConfig}.
 * Wider than {@link ResourceCondition} so resources with concrete instance
 * types remain assignable to {@link ResourcesShape}.
 */
export type ResourceConditionFn = (input: {
  subject: unknown;
  scope: string;
  resource: unknown;
  context: unknown;
}) => boolean | Promise<boolean>;

/**
 * Configuration of a single protected resource type.
 *
 * Prefer `defineResource<MyType>().actions([...])` over manually setting
 * `resource: {} as MyType` — the instance value is never read at runtime.
 */
export type ResourceConfig = {
  readonly actions: readonly string[];
  readonly resource: unknown;
  readonly conditions?: Readonly<Record<string, ResourceConditionFn>>;
};

/**
 * Resource configuration with a concrete instance type.
 */
export type ResourceConfigFor<
  Resource,
  Subject = unknown,
  Context = unknown,
> = {
  readonly actions: readonly string[];
  readonly resource: Resource;
  readonly conditions?: Readonly<
    Record<string, ResourceCondition<Subject, Resource, Context>>
  >;
};

/**
 * Shape accepted by `defineResources()`.
 */
export type ResourcesShape = Record<string, ResourceConfig>;

/**
 * Union of resource names of a definition.
 */
export type ResourceName<Resources extends ResourcesShape> = keyof Resources &
  string;

/**
 * Union of valid actions for a given resource.
 */
export type ActionOf<
  Resources extends ResourcesShape,
  Name extends ResourceName<Resources>,
> = Resources[Name]['actions'][number];

/**
 * Runtime instance type of a given resource.
 */
export type InstanceOf<
  Resources extends ResourcesShape,
  Name extends ResourceName<Resources>,
> = Resources[Name]['resource'];
