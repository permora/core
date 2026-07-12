import { expect } from 'vitest';

export type CanMatrixCase = {
  readonly resource: string;
  readonly action: string;
  readonly expected: boolean;
  readonly resourceInstance?: unknown;
};

export type CanSession = {
  can(resource: string, action: string, resourceInstance?: unknown): boolean;
};

export function expectCanMatrix(
  session: CanSession,
  cases: readonly CanMatrixCase[],
): void {
  for (const entry of cases) {
    expect(
      session.can(entry.resource, entry.action, entry.resourceInstance),
      `${entry.resource}:${entry.action}`,
    ).toBe(entry.expected);
  }
}
