/**
 * E2E mirror of examples/08-plugins.md
 */
import { describe, expect, it, vi } from 'vitest';
import { createPluginAuthz, pluginSubject } from './fixtures/08-plugins';

describe('e2e / 08 plugins', () => {
  it('fires onSessionCreate synchronously during session()', () => {
    const onSessionCreate = vi.fn();
    const authz = createPluginAuthz({ onSessionCreate });

    authz.session({ subject: pluginSubject, roles: ['viewer'] });

    expect(onSessionCreate).toHaveBeenCalledWith({
      subject: pluginSubject,
      scope: '*',
      roles: ['viewer'],
      context: undefined,
    });
  });

  it('fires grant hooks in order when allowed', () => {
    const events: string[] = [];
    const authz = createPluginAuthz({
      onEvaluationStart: () => {
        events.push('start');
      },
      onGrantEvaluation: () => {
        events.push('grant');
      },
      onEvaluationEnd: () => {
        events.push('end');
      },
      onGranted: () => {
        events.push('granted');
      },
    });

    const session = authz.session({
      subject: pluginSubject,
      roles: ['viewer'],
    });
    session.can('post', 'read');

    expect(events).toEqual(['start', 'grant', 'end', 'granted']);
  });

  it('fires deny hooks when no grant matches', () => {
    const events: string[] = [];
    const authz = createPluginAuthz({
      onEvaluationStart: () => {
        events.push('start');
      },
      onEvaluationEnd: () => {
        events.push('end');
      },
      onDenied: () => {
        events.push('denied');
      },
    });

    const session = authz.session({
      subject: pluginSubject,
      roles: ['viewer'],
    });
    session.can('post', 'update');

    expect(events).toEqual(['start', 'end', 'denied']);
  });

  it('reports conditional grant evaluation on deny path', () => {
    const onGrantEvaluation = vi.fn();
    const authz = createPluginAuthz({ onGrantEvaluation });

    const session = authz.session({
      subject: pluginSubject,
      roles: ['editor'],
    });
    session.can('post', 'delete', {
      id: 'p1',
      authorId: 'other',
      published: false,
    });

    expect(onGrantEvaluation).toHaveBeenCalledWith(
      expect.objectContaining({
        conditional: true,
        matched: false,
      }),
    );
  });

  it('fires evaluation hooks once per action in allowedActions', () => {
    const onEvaluationStart = vi.fn();
    const authz = createPluginAuthz({ onEvaluationStart });

    const session = authz.session({
      subject: pluginSubject,
      roles: ['editor'],
    });
    session.allowedActions('post', {
      id: 'p1',
      authorId: 'u1',
      published: false,
    });

    expect(onEvaluationStart).toHaveBeenCalledTimes(5);
  });
});
