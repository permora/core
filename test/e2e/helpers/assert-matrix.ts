import { expect } from 'vitest';

export type CanMatrixCase = {
  readonly resource: string;
  readonly action: string;
  readonly expected: boolean;
  readonly resourceInstance?: unknown;
};

export type CanSession = {
  can(
    resource: string,
    action: string,
    resourceInstance?: unknown,
  ): Promise<boolean>;
};

export async function expectCanMatrix(
  session: CanSession,
  cases: readonly CanMatrixCase[],
): Promise<void> {
  for (const entry of cases) {
    await expect(
      session.can(entry.resource, entry.action, entry.resourceInstance),
      `${entry.resource}:${entry.action}`,
    ).resolves.toBe(entry.expected);
  }
}
