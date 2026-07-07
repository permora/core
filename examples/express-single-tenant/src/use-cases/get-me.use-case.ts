import type { AppSession } from '../types/app-session.js';
import type { User } from '../types/user.js';

export function createGetMeUseCase() {
  return {
    execute(input: { user: User; authz: AppSession; requestId?: string }) {
      return {
        user: input.user,
        requestId: input.requestId,
        scope: input.authz.scope,
        roles: input.authz.roles,
      };
    },
  };
}
