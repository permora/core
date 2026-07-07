import { describe, expect, it } from 'vitest';
import { definePermissions } from '../../src/permissions';
import { defineResources } from '../../src/resources';

type User = { id: string };
type Project = { id: string; ownerId: string };

const resources = defineResources({
  project: {
    actions: ['read', 'update', 'delete'],
    resource: {} as Project,
  },
});

describe('definePermissions', () => {
  it('returns the definition object unchanged', () => {
    const definition = {
      '*': {
        viewer: { project: ['read'] },
      },
    } as const;

    const permissions = definePermissions<User>()(resources, definition);

    expect(permissions).toBe(definition);
  });

  it('preserves conditional permissions and extends', () => {
    const when = ({
      subject,
      resource,
    }: {
      subject: User;
      resource: Project;
    }) => resource.ownerId === subject.id;

    const permissions = definePermissions<User>()(resources, {
      '*': {
        viewer: { project: ['read'] },
        editor: {
          extends: ['viewer'],
          project: ['update', { action: 'delete', when }],
        },
      },
    });

    const editor = permissions['*'].editor;
    expect(editor.extends).toEqual(['viewer']);
    expect(editor.project).toHaveLength(2);
    expect(editor.project?.[1]).toEqual({ action: 'delete', when });
  });
});
