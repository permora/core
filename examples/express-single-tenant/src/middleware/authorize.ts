import { AuthorizationDeniedError } from '@permora/core';
import type { NextFunction, Request, Response } from 'express';

export function authorize(
  action: 'read' | 'create' | 'update' | 'delete' | 'publish',
) {
  return async function (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (req.authz === undefined) {
      res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Provide Authorization: Bearer <token>.',
      });
      return;
    }

    try {
      await req.authz.assert('post', action);
      next();
    } catch (error) {
      if (error instanceof AuthorizationDeniedError) {
        res.status(403).json({
          error: error.code,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  };
}
