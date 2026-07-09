import { PortableSessionInvalidError } from '../errors/portable-session-invalid-error';
import {
  PORTABLE_SESSION_VERSION,
  type CompactPortableSession,
  type PortableSession,
} from './portable.types';
import { parsePortableSession } from './validate-portable-session';

function intern(
  dict: Map<string, number>,
  strings: string[],
  value: string,
): number {
  let index = dict.get(value);
  if (index === undefined) {
    index = strings.length;
    strings.push(value);
    dict.set(value, index);
  }
  return index;
}

/**
 * Encodes a portable session into a compact tuple using a string dictionary.
 */
export function encodePortableSession(
  portable: PortableSession | unknown,
): CompactPortableSession {
  const session =
    portable !== null &&
    typeof portable === 'object' &&
    !Array.isArray(portable) &&
    'v' in portable
      ? (portable as PortableSession)
      : parsePortableSession(portable);

  const dict = new Map<string, number>();
  const strings: string[] = [];

  const scopeIdx = intern(dict, strings, session.scope);
  const roleIdxs = session.roles.map((role) => intern(dict, strings, role));

  const grantTuples = session.grants.map((grant) => {
    const tuple: number[] = [
      intern(dict, strings, grant.resource),
      intern(dict, strings, grant.action),
      intern(dict, strings, grant.sourceScope),
      intern(dict, strings, grant.sourceRole),
    ];

    if (grant.condition !== undefined) {
      tuple.push(intern(dict, strings, grant.condition));
    }

    return tuple;
  });

  return [
    PORTABLE_SESSION_VERSION,
    scopeIdx,
    roleIdxs,
    session.subject,
    strings,
    grantTuples,
  ];
}

/**
 * Decodes a compact portable session tuple back into the JSON shape.
 */
export function decodePortableSession(value: unknown): PortableSession {
  if (!Array.isArray(value)) {
    throw new PortableSessionInvalidError(
      'Compact portable session must be an array tuple',
    );
  }

  const [v, scopeIdx, roleIdxs, subject, dict, grantTuples] = value;

  if (v !== PORTABLE_SESSION_VERSION) {
    throw new PortableSessionInvalidError(
      `Unsupported compact portable session version: ${String(v)}`,
    );
  }

  if (
    typeof scopeIdx !== 'number' ||
    !Array.isArray(roleIdxs) ||
    !Array.isArray(dict) ||
    !Array.isArray(grantTuples) ||
    dict.some((entry) => typeof entry !== 'string') ||
    roleIdxs.some((entry) => typeof entry !== 'number')
  ) {
    throw new PortableSessionInvalidError(
      'Malformed compact portable session tuple',
    );
  }

  const lookup = (index: number, field: string): string => {
    const entry = dict[index];
    if (typeof entry !== 'string') {
      throw new PortableSessionInvalidError(
        `Invalid dictionary index for ${field}: ${String(index)}`,
      );
    }
    return entry;
  };

  const grants = grantTuples.map((tuple, grantIndex) => {
    if (!Array.isArray(tuple) || tuple.length < 4 || tuple.length > 5) {
      throw new PortableSessionInvalidError(
        `Malformed grant tuple at index ${grantIndex}`,
      );
    }

    const [
      resourceIdx,
      actionIdx,
      sourceScopeIdx,
      sourceRoleIdx,
      conditionIdx,
    ] = tuple;

    if (
      [resourceIdx, actionIdx, sourceScopeIdx, sourceRoleIdx].some(
        (entry) => typeof entry !== 'number',
      ) ||
      (conditionIdx !== undefined && typeof conditionIdx !== 'number')
    ) {
      throw new PortableSessionInvalidError(
        `Malformed grant tuple at index ${grantIndex}`,
      );
    }

    return {
      resource: lookup(resourceIdx, 'resource'),
      action: lookup(actionIdx, 'action'),
      sourceScope: lookup(sourceScopeIdx, 'sourceScope'),
      sourceRole: lookup(sourceRoleIdx, 'sourceRole'),
      ...(conditionIdx !== undefined
        ? { condition: lookup(conditionIdx, 'condition') }
        : {}),
    };
  });

  return parsePortableSession({
    v: PORTABLE_SESSION_VERSION,
    scope: lookup(scopeIdx, 'scope'),
    roles: roleIdxs.map((index) => lookup(index, 'role')),
    subject,
    grants,
  });
}
