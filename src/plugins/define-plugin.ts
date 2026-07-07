import type { AuthorizationPlugin } from './plugin.types';

/**
 * Declares an observer plugin with optional `name` for debugging.
 *
 * @example
 * const audit = definePlugin({
 *   name: 'audit',
 *   onDenied({ resource, action, reason }) {
 *     console.log('denied', resource, action, reason);
 *   },
 * });
 */
export function definePlugin<Subject = unknown, Context = unknown>(
  plugin: AuthorizationPlugin<Subject, Context>,
): AuthorizationPlugin<Subject, Context> {
  return plugin;
}
