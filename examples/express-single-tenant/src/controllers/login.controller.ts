import type { Request, Response } from 'express';
import { UserNotFoundError } from '../use-cases/login.use-case.js';

export function createLoginController(input: {
  loginUseCase: { execute(userId: string): { token: string; user: unknown } };
}) {
  return (req: Request, res: Response): void => {
    const userId = typeof req.body?.userId === 'string' ? req.body.userId : '';

    try {
      const result = input.loginUseCase.execute(userId);
      res.json(result);
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: error.message,
        });
        return;
      }

      throw error;
    }
  };
}
