import { describe, expect, it } from 'vitest';
import { can, Permissions } from '../src/index';

describe('can', () => {
  it('returns true when the required permission is granted', () => {
    expect(can(['read', 'write'], 'read')).toBe(true);
  });

  it('returns false when the required permission is missing', () => {
    expect(can(['read'], 'write')).toBe(false);
  });
});

describe('Permissions', () => {
  it('exposes grouped API', () => {
    expect(Permissions.can(['admin'], 'admin')).toBe(true);
  });
});
