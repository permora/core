import { AuthorizationDeniedError } from '@permora/core';
import { PostNotFoundError } from '../use-cases/post-errors.js';
import type { NextFunction, Request, Response } from 'express';

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AuthorizationDeniedError) {
    res.status(403).json({
      error: error.code,
      message: error.message,
    });
    return;
  }

  if (error instanceof PostNotFoundError) {
    res.status(404).json({
      error: 'POST_NOT_FOUND',
      message: error.message,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message,
  });
}
