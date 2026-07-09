import { PortableSessionInvalidError } from '../errors/portable-session-invalid-error';
import { PortableSessionStaleError } from '../errors/portable-session-stale-error';
import type { ResourcesShape } from '../resources/resource.types';
import {
  PORTABLE_SESSION_VERSION,
  type PortableGrant,
  type PortableSession,
} from './portable.types';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPortableGrant(value: unknown): value is PortableGrant {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.resource === 'string' &&
    typeof value.action === 'string' &&
    typeof value.sourceScope === 'string' &&
    typeof value.sourceRole === 'string' &&
    (value.condition === undefined || typeof value.condition === 'string')
  );
}

/**
 * Parses and structurally validates an unknown value as a portable session.
 */
export function parsePortableSession(value: unknown): PortableSession {
  if (!isPlainObject(value)) {
    throw new PortableSessionInvalidError(
      'Portable session must be a plain object',
    );
  }

  if (value.v !== PORTABLE_SESSION_VERSION) {
    throw new PortableSessionInvalidError(
      `Unsupported portable session version: ${String(value.v)}`,
    );
  }

  if (typeof value.scope !== 'string') {
    throw new PortableSessionInvalidError(
      'Portable session "scope" must be a string',
    );
  }

  if (
    !Array.isArray(value.roles) ||
    value.roles.some((role) => typeof role !== 'string')
  ) {
    throw new PortableSessionInvalidError(
      'Portable session "roles" must be an array of strings',
    );
  }

  if (!('subject' in value)) {
    throw new PortableSessionInvalidError(
      'Portable session must include a "subject" field',
    );
  }

  if (!Array.isArray(value.grants) || !value.grants.every(isPortableGrant)) {
    throw new PortableSessionInvalidError(
      'Portable session "grants" must be an array of grant objects',
    );
  }

  return value as PortableSession;
}

/**
 * Validates each grant against the current resources registry.
 */
export function validatePortableGrantsAgainstResources(
  grants: readonly PortableGrant[],
  resources: ResourcesShape,
): void {
  for (const grant of grants) {
    const config = resources[grant.resource];
    if (config === undefined) {
      throw new PortableSessionStaleError(
        `Unknown resource "${grant.resource}" in portable session`,
        'unknown-resource',
        { resource: grant.resource },
      );
    }

    if (grant.action !== '*' && !config.actions.includes(grant.action)) {
      throw new PortableSessionStaleError(
        `Unknown action "${grant.action}" for resource "${grant.resource}" in portable session`,
        'unknown-action',
        { resource: grant.resource, action: grant.action },
      );
    }

    if (grant.condition !== undefined) {
      const registry = config.conditions;
      if (registry === undefined || registry[grant.condition] === undefined) {
        throw new PortableSessionStaleError(
          `Unknown condition "${grant.condition}" for resource "${grant.resource}" in portable session`,
          'unknown-condition',
          { resource: grant.resource, condition: grant.condition },
        );
      }
    }
  }
}
