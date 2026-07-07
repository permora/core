import type { NextFunction, Request, Response } from 'express';
import { authz } from '../authz.js';
import { findUserByToken } from '../data.js';

function readBearerToken(header: string | undefined): string | undefined {
  if (header === undefined) {
    return undefined;
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || token === undefined) {
    return undefined;
  }

  return token;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  req.requestId = req.header('x-request-id') ?? crypto.randomUUID();

  const token = readBearerToken(req.header('authorization'));
  if (token === undefined) {
    next();
    return;
  }

  const user = findUserByToken(token);
  if (user === undefined) {
    next();
    return;
  }

  req.user = user;
  req.authz = authz.session({
    subject: user,
    roles: user.roles,
    context: {
      requestId: req.requestId,
    },
  });

  next();
}
