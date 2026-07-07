import type { AppSession } from './app-session.js';
import type { User } from './user.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      authz?: AppSession;
      requestId?: string;
    }
  }
}

export {};
