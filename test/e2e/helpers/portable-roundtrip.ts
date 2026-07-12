import {
  createSessionFromPortable,
  decodePortableSession,
  encodePortableSession,
} from '../../../src/index';
import type { ResourcesShape } from '../../../src/resources';
import type { CanMatrixCase, CanSession } from './assert-matrix';
import { expectCanMatrix } from './assert-matrix';

export type PortableRoundtripOptions<
  Resources extends ResourcesShape,
  Context,
> = {
  readonly resources: Resources;
  readonly context?: Context;
  readonly wire?: 'json' | 'compact';
};

export type PortableSessionSource = {
  toPortable(): unknown;
};

export function roundtripPortable<
  Resources extends ResourcesShape,
  Context = Record<string, never>,
>(
  session: PortableSessionSource,
  options: PortableRoundtripOptions<Resources, Context>,
) {
  const portable = session.toPortable();
  const payload =
    options.wire === 'compact'
      ? decodePortableSession(encodePortableSession(portable))
      : portable;

  return createSessionFromPortable(payload, {
    resources: options.resources,
    context: options.context,
  });
}

export function expectSameDecisions(
  original: CanSession,
  restored: CanSession,
  cases: readonly CanMatrixCase[],
): void {
  expectCanMatrix(original, cases);
  expectCanMatrix(restored, cases);
}
