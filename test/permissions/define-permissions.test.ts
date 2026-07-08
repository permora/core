import { describe, expect, it } from 'vitest';
import { DEFAULT_SCOPE } from '../../src/permissions/constants';
import { definePermissions } from '../../src/permissions';
import { defineResource, defineResources } from '../../src/resources';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: defineResource<Project>({
    actions: ['read', 'update', 'delete'],
  }),
});

describe('definePermissions', () => {
  it('normalizes single-tenant roles under the default scope', () => {
    const definition = {
      viewer: { project: ['read'] },
    } as const;

    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(resources, definition);

    expect(permissions).toEqual({
      [DEFAULT_SCOPE]: definition,
    });
    expect(permissions[DEFAULT_SCOPE]).toBe(definition);
  });

  it('preserves conditional permissions and extends', () => {
    const when = ({
      subject,
      resource,
    }: {
      subject: User;
      resource: Project;
    }) => resource.ownerId === subject.id;

    const permissionBuilder = definePermissions<User>();
    const permissions = permissionBuilder(resources, {
      viewer: { project: ['read'] },
      editor: {
        extends: ['viewer'],
        project: ['update', { action: 'delete', when }],
      },
    });

    const editor = permissions[DEFAULT_SCOPE].editor;
    expect(editor.extends).toEqual(['viewer']);
    expect(editor.project).toHaveLength(2);
    expect(editor.project?.[1]).toEqual({ action: 'delete', when });
  });
});
