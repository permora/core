/**
 * E2E mirror of examples/05-wildcards.md
 */
import { describe, expect, it } from 'vitest';
import { expectCanMatrix } from './helpers/assert-matrix';
import {
  foreignProject,
  wildcardAuthz,
  wildcardSubject,
} from './fixtures/05-wildcards';

describe('e2e / 05 wildcards', () => {
  const adminSession = wildcardAuthz.session({
    subject: wildcardSubject,
    roles: ['admin'],
  });

  const viewerSession = wildcardAuthz.session({
    subject: wildcardSubject,
    roles: ['viewer'],
  });

  it('matches viewer vs admin matrices', async () => {
    await expectCanMatrix(viewerSession, [
      { resource: 'project', action: 'read', expected: true },
      { resource: 'project', action: 'update', expected: false },
      { resource: 'project', action: 'delete', expected: false },
    ]);

    await expectCanMatrix(adminSession, [
      { resource: 'project', action: 'read', expected: true },
      { resource: 'project', action: 'update', expected: true },
      { resource: 'project', action: 'delete', expected: true },
    ]);
  });

  it('allows wildcard delete without resource instance', async () => {
    await expect(
      adminSession.can('project', 'delete', foreignProject),
    ).resolves.toBe(true);
  });

  it('keeps wildcard unexpanded in permissionGraph', () => {
    const snapshot = adminSession.permissionGraph();

    expect(snapshot.resolvedRoles[0]?.permissions).toEqual([
      { resource: 'project', action: '*', conditional: false },
    ]);
  });

  it('expands wildcards in allowedActions', async () => {
    await expect(adminSession.allowedActions('project')).resolves.toEqual([
      'read',
      'update',
      'delete',
    ]);
  });

  it('combines grants from multiple roles with OR semantics', async () => {
    const session = wildcardAuthz.session({
      subject: wildcardSubject,
      roles: ['viewer', 'admin'],
    });

    await expect(session.can('project', 'update')).resolves.toBe(true);
  });
});
