import { describe, expectTypeOf, it } from 'vitest';
import { defineResource, defineResources } from '../../src/resources';
import type { ActionOf, InstanceOf, ResourceName } from '../../src/resources';

type User = { id: string };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };
type Ctx = { requestId: string };

const resources = defineResources({
  project: defineResource<Project>().actions([
    'create',
    'read',
    'update',
    'delete',
  ]),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

type Resources = typeof resources;

describe('defineResources type inference', () => {
  it('infers resource names', () => {
    expectTypeOf<ResourceName<Resources>>().toEqualTypeOf<
      'project' | 'invoice'
    >();
  });

  it('infers action literals per resource', () => {
    expectTypeOf<ActionOf<Resources, 'project'>>().toEqualTypeOf<
      'create' | 'read' | 'update' | 'delete'
    >();

    expectTypeOf<ActionOf<Resources, 'invoice'>>().toEqualTypeOf<
      'read' | 'approve'
    >();
  });

  it('infers the resource instance type', () => {
    expectTypeOf<InstanceOf<Resources, 'project'>>().toEqualTypeOf<Project>();
    expectTypeOf<InstanceOf<Resources, 'invoice'>>().toEqualTypeOf<Invoice>();
  });

  it('types named conditions with Subject and Resource', () => {
    const project = defineResource<Project, User, Ctx>().actions(
      ['read', 'delete'],
      {
        conditions: {
          'owner-only': ({ subject, resource, context }) => {
            expectTypeOf(subject).toEqualTypeOf<User>();
            expectTypeOf(resource).toEqualTypeOf<Project>();
            expectTypeOf(context).toEqualTypeOf<Ctx>();
            return resource.ownerId === subject.id;
          },
        },
      },
    );

    expectTypeOf(project.actions).toEqualTypeOf<readonly ['read', 'delete']>();
    expectTypeOf(project.resource).toEqualTypeOf<Project>();
  });

  it('rejects definitions without actions', () => {
    defineResources({
      // @ts-expect-error actions is required
      project: { resource: {} as Project },
    });
  });

  it('rejects non-string actions', () => {
    defineResources({
      // @ts-expect-error actions must be strings
      project: { actions: [1, 2], resource: {} as Project },
    });
  });
});
