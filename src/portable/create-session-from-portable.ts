import type { AuthorizationPlugin } from '../plugins/plugin.types';
import type { ResourcesShape } from '../resources/resource.types';
import { buildGrantIndex } from '../grants/grant-index';
import { AuthorizationSession } from '../session/authorization-session';
import {
  hydratePortableGrants,
  resolvedRolesFromGrants,
} from './hydrate-portable-grants';
import type { PortableSession } from './portable.types';
import {
  parsePortableSession,
  validatePortableGrantsAgainstResources,
} from './validate-portable-session';

export type CreateSessionFromPortableOptions<
  Resources extends ResourcesShape,
  Subject,
  Context,
> = {
  readonly resources: Resources;
  readonly context?: Context;
  readonly plugins?: readonly AuthorizationPlugin<Subject, Context>[];
};

/**
 * Rehydrates an {@link AuthorizationSession} from a portable payload.
 *
 * Validates the payload against the current `resources` registry.
 * Throws {@link PortableSessionStaleError} when grants reference removed
 * resources, actions or condition ids — the consumer should refresh.
 *
 * Transport integrity and expiration are not handled here.
 */
export function createSessionFromPortable<
  Resources extends ResourcesShape,
  Subject,
  Context = Record<string, never>,
>(
  portable: unknown,
  options: CreateSessionFromPortableOptions<Resources, Subject, Context>,
): AuthorizationSession<Resources, Subject, Context> {
  const parsed = parsePortableSession(portable) as PortableSession<Subject>;

  validatePortableGrantsAgainstResources(parsed.grants, options.resources);

  const compiledGrants = hydratePortableGrants(
    parsed.grants,
    options.resources,
  );
  const grants = buildGrantIndex(compiledGrants);
  const resolvedRoles = resolvedRolesFromGrants(compiledGrants);
  const context = (options.context ?? {}) as Context;

  return new AuthorizationSession<Resources, Subject, Context>(
    options.resources,
    {
      subject: parsed.subject,
      scope: parsed.scope,
      roles: parsed.roles,
      context,
      resolvedRoles,
      grants,
    },
    options.plugins ?? [],
  );
}
