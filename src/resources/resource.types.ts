/**
 * Configuration of a single protected resource type.
 *
 * `resource` carries only the TypeScript type of the runtime instance
 * (declared via `{} as MyType`); its value is never read.
 */
export type ResourceConfig = {
  readonly actions: readonly string[];
  readonly resource: unknown;
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
