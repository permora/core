/**
 * Type-safety: `when` contextual typing with scopedPermissions().
 */
import { describe, expectTypeOf, it } from 'vitest';
import {
  definePermissions,
  defineResource,
  defineResources,
} from '../../src/index';
import { scopedPermissions } from '../../src/scoped';

type User = { id: string; approvalLimit: number };
type Project = { id: string; ownerId: string };
type Invoice = { id: string; amount: number };
type Ctx = { requestId: string };

const resources = defineResources({
  project: defineResource<Project>().actions(['read', 'update', 'delete']),
  invoice: defineResource<Invoice>().actions(['read', 'approve']),
});

describe('scopedPermissions when inference', () => {
  it('types subject and resource in flat scoped when callbacks', () => {
    definePermissions({ resources })
      .forSubject<User, Ctx>()
      .with(scopedPermissions())
      .from({
        '*': {
          editor: {
            project: [
              {
                action: 'delete',
                when: ({ subject, resource, context, scope }) => {
                  expectTypeOf(subject).toEqualTypeOf<User>();
                  expectTypeOf(resource).toEqualTypeOf<Project>();
                  expectTypeOf(context).toEqualTypeOf<Ctx>();
                  expectTypeOf(scope).toEqualTypeOf<string>();
                  return resource.ownerId === subject.id;
                },
              },
            ],
          },
        },
        'org:acme': {
          manager: {
            invoice: [
              {
                action: 'approve',
                when: ({ subject, resource }) => {
                  expectTypeOf(subject).toEqualTypeOf<User>();
                  expectTypeOf(resource).toEqualTypeOf<Invoice>();
                  return resource.amount <= subject.approvalLimit;
                },
              },
            ],
          },
        },
      });
  });

  it('types subject and resource in nested scoped when callbacks', () => {
    definePermissions({ resources })
      .forSubject<User, Ctx>()
      .with(scopedPermissions({ nested: true }))
      .from({
        arasaka: {
          staging: {
            editor: {
              project: [
                {
                  action: 'delete',
                  when: ({ subject, resource }) => {
                    expectTypeOf(subject).toEqualTypeOf<User>();
                    expectTypeOf(resource).toEqualTypeOf<Project>();
                    return resource.ownerId === subject.id;
                  },
                },
              ],
            },
          },
        },
      });
  });
});
