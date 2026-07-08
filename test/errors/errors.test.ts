import { describe, expect, it } from 'vitest';
import {
  AuthorizationDeniedError,
  AuthorizationError,
  CircularRoleInheritanceError,
  InvalidPermissionDefinitionError,
  UnknownRoleError,
} from '../../src/errors';

describe('UnknownRoleError', () => {
  const error = new UnknownRoleError({ scope: 'org:acme', role: 'ghost' });

  it('extends AuthorizationError and Error', () => {
    expect(error).toBeInstanceOf(AuthorizationError);
    expect(error).toBeInstanceOf(Error);
  });

  it('has the AUTHZ_UNKNOWN_ROLE code', () => {
    expect(error.code).toBe('AUTHZ_UNKNOWN_ROLE');
  });

  it('exposes scope and role', () => {
    expect(error.scope).toBe('org:acme');
    expect(error.role).toBe('ghost');
    expect(error.message).toContain('ghost');
    expect(error.message).toContain('org:acme');
    expect(error.message).toContain('fallback');
  });

  it('omits fallback hint when fallback is disabled', () => {
    const strictError = new UnknownRoleError({
      scope: 'org:acme',
      role: 'ghost',
      fallbackEnabled: false,
    });

    expect(strictError.message).not.toContain('fallback');
    expect(strictError.message).not.toContain('"*"');
  });

  it('has the class name as error name', () => {
    expect(error.name).toBe('UnknownRoleError');
  });
});

describe('CircularRoleInheritanceError', () => {
  const error = new CircularRoleInheritanceError({
    scope: '*',
    path: ['admin', 'manager', 'editor', 'admin'],
  });

  it('has the AUTHZ_CIRCULAR_ROLE_INHERITANCE code', () => {
    expect(error.code).toBe('AUTHZ_CIRCULAR_ROLE_INHERITANCE');
  });

  it('exposes scope and full cycle path', () => {
    expect(error.scope).toBe('*');
    expect(error.path).toEqual(['admin', 'manager', 'editor', 'admin']);
    expect(error.message).toContain('admin → manager → editor → admin');
  });
});

describe('AuthorizationDeniedError', () => {
  const error = new AuthorizationDeniedError({
    subject: { id: 'user_123' },
    scope: 'org:acme',
    roles: ['manager'],
    resource: 'invoice',
    action: 'approve',
  });

  it('has the AUTHZ_DENIED code', () => {
    expect(error.code).toBe('AUTHZ_DENIED');
  });

  it('exposes denial details without resource instance', () => {
    expect(error.subject).toEqual({ id: 'user_123' });
    expect(error.scope).toBe('org:acme');
    expect(error.roles).toEqual(['manager']);
    expect(error.resource).toBe('invoice');
    expect(error.action).toBe('approve');
    expect(error).not.toHaveProperty('resourceInstance');
  });
});

describe('InvalidPermissionDefinitionError', () => {
  const error = new InvalidPermissionDefinitionError('bad definition');

  it('has the AUTHZ_INVALID_PERMISSION_DEFINITION code', () => {
    expect(error.code).toBe('AUTHZ_INVALID_PERMISSION_DEFINITION');
    expect(error.message).toBe('bad definition');
  });
});
