import { describe, expect, it } from 'vitest';
import { createGrantIndex, lookupGrants } from '../../src/grants';
import type { ResolvedRole } from '../../src/roles';
import { testResources } from '../fixtures/resources';

const isOwner = () => true;
const isManager = () => false;

const roles: ResolvedRole[] = [
  {
    sourceScope: '*',
    role: 'viewer',
    definition: { project: ['read'] },
  },
  {
    sourceScope: '*',
    role: 'editor',
    definition: {
      project: [
        { action: 'update', when: isOwner },
        { action: 'update', when: isManager },
        '*',
      ],
    },
  },
];

describe('createGrantIndex', () => {
  it('indexes grants by resource and action', () => {
    const index = createGrantIndex(roles, testResources);

    expect(index.get('project')?.get('read')).toHaveLength(1);
    expect(index.get('project')?.get('*')).toHaveLength(1);
  });

  it('accumulates multiple grants for the same resource/action (OR semantics)', () => {
    const index = createGrantIndex(roles, testResources);
    const updateGrants = index.get('project')?.get('update');

    expect(updateGrants).toHaveLength(2);
    expect(updateGrants?.map((grant) => grant.when)).toEqual([
      isOwner,
      isManager,
    ]);
  });
});

describe('lookupGrants', () => {
  const index = createGrantIndex(roles, testResources);

  it('returns exact grants followed by wildcard grants', () => {
    const candidates = lookupGrants(index, 'project', 'read');

    expect(candidates).toHaveLength(2);
    expect(candidates[0]?.action).toBe('read');
    expect(candidates[1]?.action).toBe('*');
  });

  it('returns only wildcard grants when there is no exact match', () => {
    const candidates = lookupGrants(index, 'project', 'delete');

    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.action).toBe('*');
  });

  it('returns empty array for unknown resources', () => {
    expect(lookupGrants(index, 'invoice', 'read')).toEqual([]);
  });

  it('does not duplicate wildcard grants when looking up "*"', () => {
    const candidates = lookupGrants(index, 'project', '*');

    expect(candidates).toHaveLength(1);
  });
});
