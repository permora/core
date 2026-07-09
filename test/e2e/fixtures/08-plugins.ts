import {
  createAuthorization,
  definePermissions,
  definePlugin,
  defineResource,
  defineResources,
} from '../../../src/index';
import type { Post, User } from './shared-types';

export const pluginResources = defineResources({
  post: defineResource<Post>().actions([
    'read',
    'create',
    'update',
    'delete',
    'publish',
  ]),
});

export const pluginPermissions = definePermissions({
  resources: pluginResources,
})
  .forSubject<User>()
  .from({
    viewer: { post: ['read'] },
    editor: {
      extends: ['viewer'],
      post: [
        'create',
        'update',
        {
          action: 'delete',
          when: ({ subject, resource }) => resource.authorId === subject.id,
        },
      ],
    },
  });

export function createPluginAuthz(hooks: {
  onSessionCreate?: ReturnType<typeof definePlugin>['onSessionCreate'];
  onEvaluationStart?: ReturnType<typeof definePlugin>['onEvaluationStart'];
  onGrantEvaluation?: ReturnType<typeof definePlugin>['onGrantEvaluation'];
  onEvaluationEnd?: ReturnType<typeof definePlugin>['onEvaluationEnd'];
  onGranted?: ReturnType<typeof definePlugin>['onGranted'];
  onDenied?: ReturnType<typeof definePlugin>['onDenied'];
}) {
  const plugin = definePlugin({ name: 'audit', ...hooks });

  return createAuthorization({
    resources: pluginResources,
    permissions: pluginPermissions,
    plugins: [plugin],
  });
}

export const pluginSubject: User = { id: 'u1' };
