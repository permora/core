import { describe, expect, it, vi } from 'vitest';
import { compileSession } from '../../src/session/compile-session';
import { testResources } from '../fixtures/resources';

describe('compileSession', () => {
  it('defaults scope to "*"', () => {
    const session = compileSession(
      { '*': { viewer: { project: ['read'] } } },
      { subject: { id: 'u1' }, roles: ['viewer'] },
      testResources,
    );

    expect(session.scope).toBe('*');
  });

  it('keeps subject and context by reference', () => {
    const subject = { id: 'u1' };
    const context = { flag: true };

    const session = compileSession(
      { '*': { viewer: {} } },
      { subject, roles: ['viewer'], context },
      testResources,
    );

    expect(session.subject).toBe(subject);
    expect(session.context).toBe(context);
  });

  it('collects grants from reachable roles only', () => {
    const permissions = {
      '*': {
        viewer: { project: ['read'] },
        editor: { extends: ['viewer'], project: ['update'] },
        support: { ticket: ['read'] },
      },
      'org:acme': {
        manager: { extends: ['editor'], invoice: ['read'] },
        auditor: { invoice: ['read'] },
      },
      'org:stark': {
        admin: { project: ['*'] },
      },
    };

    const session = compileSession(
      permissions,
      {
        subject: { id: 'u1' },
        scope: 'org:acme',
        roles: ['manager'],
      },
      testResources,
    );

    // manager → editor → viewer; support, auditor and org:stark roles
    // must not contribute grants.
    expect(session.grants.get('project')?.get('read')).toHaveLength(1);
    expect(session.grants.get('project')?.get('update')).toHaveLength(1);
    expect(session.grants.get('invoice')?.get('read')).toHaveLength(1);
    expect(session.grants.get('ticket')).toBeUndefined();
    expect(session.grants.get('project')?.get('*')).toBeUndefined();
  });

  it('does not execute conditions during compilation', () => {
    const when = vi.fn(() => true);

    compileSession(
      { '*': { editor: { project: [{ action: 'delete', when }] } } },
      { subject: {}, roles: ['editor'] },
      testResources,
    );

    expect(when).not.toHaveBeenCalled();
  });

  it('does not process unrelated scopes: cycles in unused branches are ignored', () => {
    const permissions = {
      '*': { viewer: { project: ['read'] } },
      'org:broken': {
        a: { extends: ['b'] },
        b: { extends: ['a'] },
      },
    };

    expect(() =>
      compileSession(
        permissions,
        { subject: {}, roles: ['viewer'] },
        testResources,
      ),
    ).not.toThrow();
  });

  it('does not expand wildcards during compilation', () => {
    const session = compileSession(
      { '*': { admin: { project: ['*'] } } },
      { subject: {}, roles: ['admin'] },
      testResources,
    );

    const actions = session.grants.get('project');
    expect([...(actions?.keys() ?? [])]).toEqual(['*']);
  });
});
