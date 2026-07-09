import { describe, expectTypeOf, it } from 'vitest';
import {
  createAuthorization,
  definePermissions,
  definePlugin,
  defineResource,
  defineResources,
} from '../../src/index';

type User = { id: string; role: string };
type Ctx = { requestId: string };
type Project = { id: string };

const resources = defineResources({
  project: defineResource<Project>().actions(['read']),
});

const permissions = definePermissions({ resources })
  .forSubject<User, Ctx>()
  .from({
    viewer: { project: ['read'] },
  });

const plugin = definePlugin<User, Ctx>({
  onSessionCreate({ subject, context }) {
    expectTypeOf(subject).toEqualTypeOf<User>();
    expectTypeOf(context).toEqualTypeOf<Ctx>();
  },
  onEvaluationStart({ subject, context, roles }) {
    expectTypeOf(subject).toEqualTypeOf<User>();
    expectTypeOf(context).toEqualTypeOf<Ctx>();
    expectTypeOf(roles).toEqualTypeOf<readonly string[]>();
  },
});

const authz = createAuthorization({
  resources,
  permissions,
  plugins: [plugin],
});

describe('plugin type safety', () => {
  it('types plugin hooks with Subject and Context from createAuthorization', () => {
    authz.session({
      subject: { id: 'u1', role: 'admin' },
      roles: ['viewer'],
      context: { requestId: 'req-1' },
    });
  });
});
