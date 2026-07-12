import { describe, expect, it } from 'vitest';
import { buildExplanation } from '../../src/evaluator/build-explanation';
import type { EvaluationResult } from '../../src/evaluator/evaluator.types';

const baseInput = {
  scope: 'org:acme',
  roles: ['editor'],
  resource: 'project',
  action: 'delete',
};

describe('buildExplanation', () => {
  it('maps an unconditional allow result', () => {
    const result: EvaluationResult = {
      allowed: true,
      reason: 'GRANT_MATCHED',
      evaluatedGrants: [
        {
          grant: {
            sourceScope: '*',
            sourceRole: 'editor',
            resource: 'project',
            action: 'delete',
          },
          matched: true,
        },
      ],
      grantedBy: {
        sourceScope: '*',
        sourceRole: 'editor',
        resource: 'project',
        action: 'delete',
      },
    };

    expect(buildExplanation(baseInput, result)).toEqual({
      allowed: true,
      scope: 'org:acme',
      roles: ['editor'],
      resource: 'project',
      action: 'delete',
      reason: 'GRANT_MATCHED',
      evaluatedGrants: [
        {
          sourceScope: '*',
          sourceRole: 'editor',
          action: 'delete',
          conditional: false,
          matched: true,
        },
      ],
      grantedBy: {
        sourceScope: '*',
        sourceRole: 'editor',
        action: 'delete',
      },
    });
  });

  it('maps a conditional denial result', () => {
    const result: EvaluationResult = {
      allowed: false,
      reason: 'ALL_CONDITIONS_FAILED',
      evaluatedGrants: [
        {
          grant: {
            sourceScope: '*',
            sourceRole: 'editor',
            resource: 'project',
            action: 'delete',
            when: () => false,
          },
          matched: false,
        },
      ],
    };

    expect(buildExplanation(baseInput, result)).toEqual({
      allowed: false,
      scope: 'org:acme',
      roles: ['editor'],
      resource: 'project',
      action: 'delete',
      reason: 'ALL_CONDITIONS_FAILED',
      evaluatedGrants: [
        {
          sourceScope: '*',
          sourceRole: 'editor',
          action: 'delete',
          conditional: true,
          matched: false,
        },
      ],
      grantedBy: undefined,
    });
  });

  it('maps a no-matching-grant denial', () => {
    const result: EvaluationResult = {
      allowed: false,
      reason: 'NO_MATCHING_GRANT',
      evaluatedGrants: [],
    };

    expect(buildExplanation(baseInput, result).evaluatedGrants).toEqual([]);
    expect(buildExplanation(baseInput, result).grantedBy).toBeUndefined();
  });
});
