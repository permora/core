import type { Request } from 'express';
import type { AppSession } from '../types/app-session.js';
import type { User } from '../types/user.js';

export function readRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function requireAuthenticatedRequest(req: Request): {
  user: User;
  authz: AppSession;
} {
  if (req.user === undefined || req.authz === undefined) {
    throw new Error('Authenticated request expected.');
  }

  return {
    user: req.user,
    authz: req.authz,
  };
}

export function readTitleFromBody(body: unknown): string {
  if (typeof body === 'object' && body !== null && 'title' in body) {
    const title = (body as { title?: unknown }).title;
    if (typeof title === 'string' && title.length > 0) {
      return title;
    }
  }

  return 'Untitled';
}
