import type { AuthorizationExplanation } from '@permora/core';

export function createExplainPostDeleteUseCase() {
  return {
    execute(explanation: AuthorizationExplanation) {
      return { explanation };
    },
  };
}
