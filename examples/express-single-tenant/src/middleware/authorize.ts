import { AuthorizationDeniedError } from '@permora/core';
import type { NextFunction, Request, Response } from 'express';
import { findPostById } from '../data.js';
import type { Post } from '../types.js';

type ResourceLoader = (req: Request) => Post | undefined;

function readRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

export function authorize(
  action: 'read' | 'create' | 'update' | 'delete' | 'publish',
  loadResource?: ResourceLoader,
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

    const resource = loadResource?.(req);

    if (loadResource !== undefined && resource === undefined) {
      res.status(404).json({
        error: 'POST_NOT_FOUND',
        message: `Post "${req.params.id}" was not found.`,
      });
      return;
    }

    try {
      await req.authz.assert('post', action, resource);
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

export function loadPostFromParams(req: Request): Post | undefined {
  return findPostById(readRouteParam(req.params.id));
}
