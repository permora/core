import { describe, expect, it, vi } from 'vitest';
import { evaluate } from '../../src/evaluator';
import { createGrantIndex } from '../../src/grants';
import type { ResolvedRole } from '../../src/roles';

function indexOf(definition: ResolvedRole['definition']) {
  return createGrantIndex([{ sourceScope: '*', role: 'tester', definition }]);
}

function baseInput(grants: ReturnType<typeof indexOf>) {
  return {
    grants,
    subject: { id: 'u1' },
    scope: '*',
    roles: ['tester'],
    context: undefined,
    resource: 'project',
    action: 'read',
    resourceInstance: undefined,
  };
}

describe('evaluate', () => {
  it('allows via exact grant without condition', async () => {
    const result = await evaluate(baseInput(indexOf({ project: ['read'] })));

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('GRANT_MATCHED');
    expect(result.grantedBy?.action).toBe('read');
  });

  it('allows via wildcard grant', async () => {
    const result = await evaluate(baseInput(indexOf({ project: ['*'] })));

    expect(result.allowed).toBe(true);
    expect(result.grantedBy?.action).toBe('*');
  });

  it('denies with default deny when there are no grants', async () => {
    const result = await evaluate(baseInput(indexOf({})));

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('NO_MATCHING_GRANT');
    expect(result.evaluatedGrants).toEqual([]);
  });

  it('denies when all conditions fail', async () => {
    const result = await evaluate(
      baseInput(indexOf({ project: [{ action: 'read', when: () => false }] })),
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('ALL_CONDITIONS_FAILED');
    expect(result.evaluatedGrants).toHaveLength(1);
    expect(result.evaluatedGrants[0]?.matched).toBe(false);
  });

  it('applies OR semantics between grants', async () => {
    const result = await evaluate(
      baseInput(
        indexOf({
          project: [
            { action: 'read', when: () => false },
            { action: 'read', when: () => true },
          ],
        }),
      ),
    );

    expect(result.allowed).toBe(true);
    expect(result.reason).toBe('CONDITION_MATCHED');
    expect(result.evaluatedGrants).toHaveLength(2);
  });

  it('short-circuits after the first allowing grant', async () => {
    const secondCondition = vi.fn(() => true);

    const result = await evaluate(
      baseInput(
        indexOf({
          project: ['read', { action: 'read', when: secondCondition }],
        }),
      ),
    );

    expect(result.allowed).toBe(true);
    expect(secondCondition).not.toHaveBeenCalled();
    expect(result.evaluatedGrants).toHaveLength(1);
  });

  it('supports async conditions resolving true', async () => {
    const result = await evaluate(
      baseInput(
        indexOf({ project: [{ action: 'read', when: async () => true }] }),
      ),
    );

    expect(result.allowed).toBe(true);
  });

  it('supports async conditions resolving false', async () => {
    const result = await evaluate(
      baseInput(
        indexOf({ project: [{ action: 'read', when: async () => false }] }),
      ),
    );

    expect(result.allowed).toBe(false);
  });

  it('propagates exceptions thrown by conditions', async () => {
    const boom = new Error('external check failed');

    await expect(
      evaluate(
        baseInput(
          indexOf({
            project: [
              {
                action: 'read',
                when: () => {
                  throw boom;
                },
              },
            ],
          }),
        ),
      ),
    ).rejects.toBe(boom);
  });

  it('passes subject, scope, resource instance and context to conditions', async () => {
    const when = vi.fn(() => true);
    const subject = { id: 'u1' };
    const instance = { id: 'p1' };
    const context = { flag: true };

    await evaluate({
      grants: indexOf({ project: [{ action: 'read', when }] }),
      subject,
      scope: 'org:acme',
      roles: ['viewer'],
      context,
      resource: 'project',
      action: 'read',
      resourceInstance: instance,
    });

    expect(when).toHaveBeenCalledWith({
      subject,
      scope: 'org:acme',
      resource: instance,
      context,
    });
  });
});
