import { describe, expect, it } from 'vitest';
import { resolveRole } from '../../src/roles';

const permissions = {
  '*': {
    viewer: { project: ['read'] },
    editor: {
      extends: ['viewer'],
      project: ['read', 'update'],
    },
  },
  'org:acme': {
    editor: { project: ['read'] },
    manager: { invoice: ['read'] },
  },
};

describe('resolveRole', () => {
  it('resolves a role in the default scope', () => {
    const resolved = resolveRole(permissions, '*', 'viewer');

    expect(resolved).toEqual({
      sourceScope: '*',
      role: 'viewer',
      definition: permissions['*'].viewer,
    });
  });

  it('resolves a role in a specific scope', () => {
    const resolved = resolveRole(permissions, 'org:acme', 'manager');

    expect(resolved?.sourceScope).toBe('org:acme');
    expect(resolved?.definition).toBe(permissions['org:acme'].manager);
  });

  it('falls back to the default scope per role', () => {
    const resolved = resolveRole(permissions, 'org:acme', 'viewer');

    expect(resolved?.sourceScope).toBe('*');
    expect(resolved?.definition).toBe(permissions['*'].viewer);
  });

  it('applies full override: specific definition replaces default entirely', () => {
    const resolved = resolveRole(permissions, 'org:acme', 'editor');

    expect(resolved?.sourceScope).toBe('org:acme');
    expect(resolved?.definition).toBe(permissions['org:acme'].editor);
    // No merge: the default editor's extends and update permission are gone.
    expect(resolved?.definition.extends).toBeUndefined();
    expect(resolved?.definition['project']).toEqual(['read']);
  });

  it('does not fall back per resource', () => {
    // org:acme.editor has no invoice permissions; resolution must not
    // borrow resources from *.editor.
    const resolved = resolveRole(permissions, 'org:acme', 'editor');

    expect(resolved?.definition['invoice']).toBeUndefined();
  });

  it('returns undefined for unknown roles', () => {
    expect(resolveRole(permissions, 'org:acme', 'ghost')).toBeUndefined();
    expect(resolveRole(permissions, '*', 'ghost')).toBeUndefined();
  });

  it('resolves from an unknown scope via default fallback', () => {
    const resolved = resolveRole(permissions, 'org:unknown', 'viewer');

    expect(resolved?.sourceScope).toBe('*');
  });
});
