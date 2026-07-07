import { describe, expect, it } from 'vitest';
import {
  CircularRoleInheritanceError,
  UnknownRoleError,
} from '../../src/errors';
import { collectRoleGraph } from '../../src/roles';

function rolesOf(
  resolved: ReadonlyArray<{ sourceScope: string; role: string }>,
) {
  return resolved.map((entry) => `${entry.sourceScope}.${entry.role}`);
}

describe('collectRoleGraph', () => {
  it('collects a single role without inheritance', () => {
    const permissions = {
      '*': { viewer: { project: ['read'] } },
    };

    const collected = collectRoleGraph(permissions, '*', ['viewer']);

    expect(rolesOf(collected)).toEqual(['*.viewer']);
  });

  it('collects simple inheritance', () => {
    const permissions = {
      '*': {
        viewer: { project: ['read'] },
        editor: { extends: ['viewer'], project: ['update'] },
      },
    };

    const collected = collectRoleGraph(permissions, '*', ['editor']);

    expect(rolesOf(collected)).toEqual(['*.editor', '*.viewer']);
  });

  it('collects transitive inheritance', () => {
    const permissions = {
      '*': {
        viewer: {},
        editor: { extends: ['viewer'] },
        manager: { extends: ['editor'] },
      },
    };

    const collected = collectRoleGraph(permissions, '*', ['manager']);

    expect(rolesOf(collected)).toEqual(['*.manager', '*.editor', '*.viewer']);
  });

  it('collects multiple parents', () => {
    const permissions = {
      '*': {
        viewer: {},
        billing: {},
        manager: { extends: ['viewer', 'billing'] },
      },
    };

    const collected = collectRoleGraph(permissions, '*', ['manager']);

    expect(rolesOf(collected)).toEqual(['*.manager', '*.viewer', '*.billing']);
  });

  it('deduplicates diamond inheritance', () => {
    const permissions = {
      '*': {
        base: {},
        left: { extends: ['base'] },
        right: { extends: ['base'] },
        top: { extends: ['left', 'right'] },
      },
    };

    const collected = collectRoleGraph(permissions, '*', ['top']);

    expect(rolesOf(collected)).toEqual([
      '*.top',
      '*.left',
      '*.base',
      '*.right',
    ]);
  });

  it('deduplicates duplicated input roles', () => {
    const permissions = {
      '*': { viewer: {} },
    };

    const collected = collectRoleGraph(permissions, '*', ['viewer', 'viewer']);

    expect(rolesOf(collected)).toEqual(['*.viewer']);
  });

  it('supports multiple input roles', () => {
    const permissions = {
      '*': { viewer: {}, billing: {} },
    };

    const collected = collectRoleGraph(permissions, '*', ['viewer', 'billing']);

    expect(rolesOf(collected)).toEqual(['*.viewer', '*.billing']);
  });

  it('resolves parents with scope fallback', () => {
    const permissions = {
      '*': { viewer: { project: ['read'] } },
      'org:acme': { manager: { extends: ['viewer'] } },
    };

    const collected = collectRoleGraph(permissions, 'org:acme', ['manager']);

    expect(rolesOf(collected)).toEqual(['org:acme.manager', '*.viewer']);
  });

  it('resolves parents respecting scope overrides', () => {
    const permissions = {
      '*': {
        viewer: { project: ['read'] },
        editor: { extends: ['viewer'] },
      },
      'org:acme': {
        viewer: { project: [] },
        manager: { extends: ['editor'] },
      },
    };

    const collected = collectRoleGraph(permissions, 'org:acme', ['manager']);

    // editor falls back to *, but its viewer parent resolves to the
    // org:acme override.
    expect(rolesOf(collected)).toEqual([
      'org:acme.manager',
      '*.editor',
      'org:acme.viewer',
    ]);
  });

  it('throws UnknownRoleError for unknown input roles', () => {
    const permissions = { '*': { viewer: {} } };

    expect(() => collectRoleGraph(permissions, '*', ['ghost'])).toThrow(
      UnknownRoleError,
    );
  });

  it('throws UnknownRoleError for unknown parent roles', () => {
    const permissions = {
      '*': { editor: { extends: ['ghost'] } },
    };

    let caught: unknown;
    try {
      collectRoleGraph(permissions, '*', ['editor']);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(UnknownRoleError);
    expect((caught as UnknownRoleError).role).toBe('ghost');
  });

  it('detects direct cycles', () => {
    const permissions = {
      '*': {
        a: { extends: ['b'] },
        b: { extends: ['a'] },
      },
    };

    let caught: unknown;
    try {
      collectRoleGraph(permissions, '*', ['a']);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(CircularRoleInheritanceError);
    expect((caught as CircularRoleInheritanceError).path).toEqual([
      'a',
      'b',
      'a',
    ]);
    expect((caught as CircularRoleInheritanceError).scope).toBe('*');
  });

  it('detects transitive cycles', () => {
    const permissions = {
      '*': {
        admin: { extends: ['manager'] },
        manager: { extends: ['editor'] },
        editor: { extends: ['admin'] },
      },
    };

    let caught: unknown;
    try {
      collectRoleGraph(permissions, '*', ['admin']);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(CircularRoleInheritanceError);
    expect((caught as CircularRoleInheritanceError).path).toEqual([
      'admin',
      'manager',
      'editor',
      'admin',
    ]);
  });

  it('does not treat shared ancestors as cycles', () => {
    const permissions = {
      '*': {
        base: {},
        left: { extends: ['base'] },
        right: { extends: ['base'] },
      },
    };

    expect(() =>
      collectRoleGraph(permissions, '*', ['left', 'right']),
    ).not.toThrow();
  });

  it('ignores cycles in unreachable branches', () => {
    const permissions = {
      '*': {
        viewer: {},
        broken: { extends: ['alsoBroken'] },
        alsoBroken: { extends: ['broken'] },
      },
    };

    expect(() => collectRoleGraph(permissions, '*', ['viewer'])).not.toThrow();
  });
});
