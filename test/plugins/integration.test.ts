import { describe, expect, it, vi } from 'vitest';
import {
  createAuthorization,
  definePermissions,
  definePlugin,
  defineResource,
  defineResources,
} from '../../src/index';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
});

const permissions = definePermissions({ resources })
  .forSubject<User>()
  .from({
    viewer: { project: ['read'] },
    editor: {
      extends: ['viewer'],
      project: [
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.ownerId === subject.id,
        },
      ],
    },
  });

describe('plugin integration', () => {
  it('does not invoke hooks when no plugins are registered', () => {
    const authz = createAuthorization({ resources, permissions });
    const onEvaluationStart = vi.fn();

    const session = authz.session({
      subject: { id: 'u1' },
      roles: ['viewer'],
    });

    session.can('project', 'read');

    expect(onEvaluationStart).not.toHaveBeenCalled();
  });

  it('invokes onSessionCreate when a session is created', () => {
    const onSessionCreate = vi.fn();
    const plugin = definePlugin({ onSessionCreate });
    const authz = createAuthorization({
      resources,
      permissions,
      plugins: [plugin],
    });

    authz.session({
      subject: { id: 'u1' },
      roles: ['viewer'],
    });

    expect(onSessionCreate).toHaveBeenCalledWith({
      subject: { id: 'u1' },
      scope: '*',
      roles: ['viewer'],
      context: undefined,
    });
  });

  it('runs the full evaluation hook cycle on allow', () => {
    const order: string[] = [];
    const plugin = definePlugin({
      onEvaluationStart: () => {
        order.push('start');
      },
      onGrantEvaluation: () => {
        order.push('grant');
      },
      onEvaluationEnd: () => {
        order.push('end');
      },
      onGranted: () => {
        order.push('granted');
      },
      onDenied: () => {
        order.push('denied');
      },
    });

    const authz = createAuthorization({
      resources,
      permissions,
      plugins: [plugin],
    });
    const session = authz.session({
      subject: { id: 'u1' },
      roles: ['viewer'],
    });

    session.can('project', 'read');

    expect(order).toEqual(['start', 'grant', 'end', 'granted']);
  });

  it('runs onDenied when evaluation fails', () => {
    const onDenied = vi.fn();
    const plugin = definePlugin({ onDenied });
    const authz = createAuthorization({
      resources,
      permissions,
      plugins: [plugin],
    });
    const session = authz.session({
      subject: { id: 'u1' },
      roles: ['viewer'],
    });

    session.can('project', 'update');

    expect(onDenied).toHaveBeenCalledWith(
      expect.objectContaining({
        allowed: false,
        resource: 'project',
        action: 'update',
      }),
    );
  });

  it('fires onGrantEvaluation for each evaluated grant with conditions', () => {
    const onGrantEvaluation = vi.fn();
    const plugin = definePlugin({ onGrantEvaluation });
    const authz = createAuthorization({
      resources,
      permissions,
      plugins: [plugin],
    });
    const session = authz.session({
      subject: { id: 'u1' },
      roles: ['editor'],
    });

    session.can('project', 'delete', {
      id: 'p1',
      ownerId: 'other',
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
    const plugin = definePlugin({ onEvaluationStart });
    const authz = createAuthorization({
      resources,
      permissions,
      plugins: [plugin],
    });
    const session = authz.session({
      subject: { id: 'u1' },
      roles: ['editor'],
    });

    session.allowedActions('project', {
      id: 'p1',
      ownerId: 'u1',
    });

    expect(onEvaluationStart).toHaveBeenCalledTimes(3);
  });

  it('propagates plugin errors during evaluation', () => {
    const plugin = definePlugin({
      onEvaluationStart: () => {
        throw new Error('audit failed');
      },
    });
    const authz = createAuthorization({
      resources,
      permissions,
      plugins: [plugin],
    });
    const session = authz.session({
      subject: { id: 'u1' },
      roles: ['viewer'],
    });

    expect(() => session.can('project', 'read')).toThrow('audit failed');
  });
});
