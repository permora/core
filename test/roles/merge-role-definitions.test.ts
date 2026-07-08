import { describe, expect, it } from 'vitest';
import { mergeRoleDefinitions } from '../../src/roles/merge-role-definitions';

describe('mergeRoleDefinitions', () => {
  it('unions extends with default first, then specific', () => {
    const merged = mergeRoleDefinitions(
      { extends: ['viewer'], project: ['read'] },
      { extends: ['billing'], invoice: ['read'] },
    );

    expect(merged.extends).toEqual(['viewer', 'billing']);
    expect(merged.project).toEqual(['read']);
    expect(merged.invoice).toEqual(['read']);
  });

  it('deduplicates extends', () => {
    const merged = mergeRoleDefinitions(
      { extends: ['viewer', 'billing'] },
      { extends: ['viewer', 'editor'] },
    );

    expect(merged.extends).toEqual(['viewer', 'billing', 'editor']);
  });

  it('concatenates permission arrays per resource', () => {
    const merged = mergeRoleDefinitions(
      { project: ['read', 'update'] },
      { project: ['delete'] },
    );

    expect(merged.project).toEqual(['read', 'update', 'delete']);
  });

  it('keeps conditional permissions from both definitions', () => {
    const whenA = () => true;
    const whenB = () => false;

    const merged = mergeRoleDefinitions(
      { project: [{ action: 'delete', when: whenA }] },
      { project: [{ action: 'delete', when: whenB }] },
    );

    expect(merged.project).toEqual([
      { action: 'delete', when: whenA },
      { action: 'delete', when: whenB },
    ]);
  });

  it('adds resources only present in specific', () => {
    const merged = mergeRoleDefinitions(
      { project: ['read'] },
      { invoice: ['approve'] },
    );

    expect(merged.project).toEqual(['read']);
    expect(merged.invoice).toEqual(['approve']);
  });

  it('omits extends when neither definition declares parents', () => {
    const merged = mergeRoleDefinitions(
      { project: ['read'] },
      { invoice: ['read'] },
    );

    expect(merged.extends).toBeUndefined();
  });
});
