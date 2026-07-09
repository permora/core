import { PortableInlineConditionError } from '../errors/portable-inline-condition-error';
import type { GrantIndex } from '../grants/grant.types';
import { flattenGrantIndex } from './flatten-grant-index';
import {
  PORTABLE_SESSION_VERSION,
  type PortableGrant,
  type PortableSession,
} from './portable.types';

/**
 * Serializes session state into a portable JSON payload.
 */
export function serializePortableSession<Subject>(input: {
  readonly scope: string;
  readonly roles: readonly string[];
  readonly subject: Subject;
  readonly grants: GrantIndex;
}): PortableSession<Subject> {
  const grants: PortableGrant[] = [];

  for (const grant of flattenGrantIndex(input.grants)) {
    if (grant.when !== undefined && grant.conditionId === undefined) {
      throw new PortableInlineConditionError(
        `Grant "${grant.sourceScope}.${grant.sourceRole}" → ${grant.resource}:${grant.action} uses an inline "when" condition. Use a named "condition" id from defineResource(...).actions(..., { conditions }) for portable sessions.`,
        {
          resource: grant.resource,
          action: grant.action,
          sourceScope: grant.sourceScope,
          sourceRole: grant.sourceRole,
        },
      );
    }

    grants.push({
      resource: grant.resource,
      action: grant.action,
      sourceScope: grant.sourceScope,
      sourceRole: grant.sourceRole,
      ...(grant.conditionId !== undefined
        ? { condition: grant.conditionId }
        : {}),
    });
  }

  return {
    v: PORTABLE_SESSION_VERSION,
    scope: input.scope,
    roles: input.roles,
    subject: input.subject,
    grants,
  };
}
