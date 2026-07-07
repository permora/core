import type { NextFunction, Request, Response } from 'express';

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.user === undefined || req.authz === undefined) {
    res.status(401).json({
      error: 'AUTHENTICATION_REQUIRED',
      message: 'Provide Authorization: Bearer <token>.',
    });
    return;
  }

  next();
}
