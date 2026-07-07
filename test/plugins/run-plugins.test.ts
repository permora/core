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
};

describe('runPluginHook', () => {
  it('is a no-op when plugins is undefined', async () => {
    const handler = vi.fn();

    await runPluginHook(undefined, 'onEvaluationStart', hookInput);

    expect(handler).not.toHaveBeenCalled();
  });

  it('is a no-op when plugins is empty', async () => {
    const handler = vi.fn();

    await runPluginHook([], 'onEvaluationStart', hookInput);

    expect(handler).not.toHaveBeenCalled();
  });

  it('awaits async handlers sequentially', async () => {
    const order: string[] = [];

    const plugins: AuthorizationPlugin[] = [
      {
        onEvaluationStart: async () => {
          await Promise.resolve();
          order.push('first');
        },
      },
      {
        onEvaluationStart: () => {
          order.push('second');
        },
      },
    ];

    await runPluginHook(plugins, 'onEvaluationStart', hookInput);

    expect(order).toEqual(['first', 'second']);
  });

  it('propagates errors from handlers', async () => {
    const plugins: AuthorizationPlugin[] = [
      {
        onEvaluationStart: () => {
          throw new Error('plugin failed');
        },
      },
    ];

    await expect(
      runPluginHook(plugins, 'onEvaluationStart', hookInput),
    ).rejects.toThrow('plugin failed');
  });
});

describe('notifyEvaluationEnd', () => {
  it('fires onEvaluationEnd then onGranted when allowed', async () => {
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

    await notifyEvaluationEnd(plugins, hookInput, {
      allowed: true,
      reason: 'GRANT_MATCHED',
      evaluatedGrants: [],
      grantedBy: {
        sourceScope: '*',
        sourceRole: 'viewer',
        resource: 'project',
        action: 'read',
      },
    });

    expect(order).toEqual(['end', 'granted']);
  });

  it('fires onEvaluationEnd then onDenied when denied', async () => {
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

    await notifyEvaluationEnd(plugins, hookInput, {
      allowed: false,
      reason: 'NO_MATCHING_GRANT',
      evaluatedGrants: [],
    });

    expect(order).toEqual(['end', 'denied']);
  });
});

describe('notifyGrantEvaluation', () => {
  it('passes grant metadata and matched flag', async () => {
    const handler = vi.fn();
    const plugins: AuthorizationPlugin[] = [{ onGrantEvaluation: handler }];

    await notifyGrantEvaluation(
      plugins,
      hookInput,
      {
        sourceScope: '*',
        sourceRole: 'editor',
        resource: 'project',
        action: 'delete',
        when: () => true,
      },
      true,
    );

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        grant: {
          sourceScope: '*',
          sourceRole: 'editor',
          action: 'delete',
        },
        conditional: true,
        matched: true,
      }),
    );
  });
});
