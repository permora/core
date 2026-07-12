import { describe, expect, it, vi } from 'vitest';
import {
  notifyEvaluationEnd,
  notifyGrantEvaluation,
  runPluginHook,
} from '../../src/plugins/run-plugins';
import type { AuthorizationPlugin } from '../../src/plugins';

const hookInput = {
  subject: { id: 'u1' },
  scope: '*',
  roles: ['viewer'],
  context: undefined,
  resource: 'project',
  action: 'read',
  resourceInstance: undefined,
  source: 'can' as const,
};

describe('runPluginHook', () => {
  it('is a no-op when plugins is undefined', () => {
    const handler = vi.fn();

    runPluginHook(undefined, 'onEvaluationStart', hookInput);

    expect(handler).not.toHaveBeenCalled();
  });

  it('is a no-op when plugins is empty', () => {
    const handler = vi.fn();

    runPluginHook([], 'onEvaluationStart', hookInput);

    expect(handler).not.toHaveBeenCalled();
  });

  it('runs handlers sequentially', () => {
    const order: string[] = [];

    const plugins: AuthorizationPlugin[] = [
      {
        onEvaluationStart: () => {
          order.push('first');
        },
      },
      {
        onEvaluationStart: () => {
          order.push('second');
        },
      },
    ];

    runPluginHook(plugins, 'onEvaluationStart', hookInput);

    expect(order).toEqual(['first', 'second']);
  });

  it('propagates errors from handlers', () => {
    const plugins: AuthorizationPlugin[] = [
      {
        onEvaluationStart: () => {
          throw new Error('plugin failed');
        },
      },
    ];

    expect(() =>
      runPluginHook(plugins, 'onEvaluationStart', hookInput),
    ).toThrow('plugin failed');
  });
});

describe('notifyEvaluationEnd', () => {
  it('fires onEvaluationEnd then onGranted when allowed', () => {
    const order: string[] = [];
    const plugins: AuthorizationPlugin[] = [
      {
        onEvaluationEnd: (ctx) => {
          order.push('end');
          expect(ctx.source).toBe('explain');
          expect(ctx.explanation.allowed).toBe(true);
          expect(ctx.explanation.resource).toBe('project');
        },
        onGranted: () => {
          order.push('granted');
        },
        onDenied: () => {
          order.push('denied');
        },
      },
    ];

    notifyEvaluationEnd(
      plugins,
      { ...hookInput, source: 'explain' },
      {
        allowed: true,
        reason: 'GRANT_MATCHED',
        evaluatedGrants: [],
        grantedBy: {
          sourceScope: '*',
          sourceRole: 'viewer',
          resource: 'project',
          action: 'read',
        },
      },
    );

    expect(order).toEqual(['end', 'granted']);
  });

  it('fires onEvaluationEnd then onDenied when denied', () => {
    const order: string[] = [];
    const plugins: AuthorizationPlugin[] = [
      {
        onEvaluationEnd: () => {
          order.push('end');
        },
        onGranted: () => {
          order.push('granted');
        },
        onDenied: () => {
          order.push('denied');
        },
      },
    ];

    notifyEvaluationEnd(plugins, hookInput, {
      allowed: false,
      reason: 'NO_MATCHING_GRANT',
      evaluatedGrants: [],
    });

    expect(order).toEqual(['end', 'denied']);
  });
});

describe('notifyGrantEvaluation', () => {
  it('passes grant metadata, matched flag and conditionId', () => {
    const handler = vi.fn();
    const plugins: AuthorizationPlugin[] = [{ onGrantEvaluation: handler }];

    notifyGrantEvaluation(
      plugins,
      { ...hookInput, source: 'assert' },
      {
        sourceScope: '*',
        sourceRole: 'editor',
        resource: 'project',
        action: 'delete',
        conditionId: 'owner-only',
        when: () => true,
      },
      true,
    );

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'assert',
        grant: {
          sourceScope: '*',
          sourceRole: 'editor',
          action: 'delete',
          conditionId: 'owner-only',
        },
        conditional: true,
        matched: true,
      }),
    );
  });
});
