/**
 * Configuration of a single protected resource type.
 *
 * Prefer `defineResource<MyType>({ actions })` over manually setting
 * `resource: {} as MyType` — the instance value is never read at runtime.
 */
export type ResourceConfig = {
  readonly actions: readonly string[];
  readonly resource: unknown;
};

/**
 * Resource configuration with a concrete instance type.
 */
export type ResourceConfigFor<Resource> = {
  readonly actions: readonly string[];
  readonly resource: Resource;
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
