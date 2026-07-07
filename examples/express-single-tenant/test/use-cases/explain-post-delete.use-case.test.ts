import { describe, expect, it } from 'vitest';
import { createExplainPostDeleteUseCase } from '../../src/use-cases/explain-post-delete.use-case.js';

const explanation = {
  allowed: false,
  scope: '*',
  roles: ['editor'],
  resource: 'post',
  action: 'delete',
  evaluatedGrants: [],
  reason: 'NO_MATCHING_GRANT',
} as const;

describe('explain post delete use case', () => {
  it('wraps the explanation payload as a response dto', () => {
    const useCase = createExplainPostDeleteUseCase();

    const result = useCase.execute(explanation as never);

    expect(result).toEqual({ explanation });
  });
});
