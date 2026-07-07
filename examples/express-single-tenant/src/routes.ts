import express from 'express';
import type { AppContainer } from './container.js';
import { createAuthenticateMiddleware } from './middleware/authenticate.js';
import { errorHandler } from './middleware/error-handler.js';
import { requireAuth } from './middleware/require-auth.js';

export function createAppRouter(container: AppContainer): express.Express {
  const app = express();

  app.use(express.json());
  app.use(
    createAuthenticateMiddleware({
      authenticationService: container.authenticationService,
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/login', container.loginController);
  app.get('/me', requireAuth, container.getMeController);
  app.get('/posts', requireAuth, container.listPostsController);
  app.post('/posts', requireAuth, container.createPostController);
  app.patch('/posts/:id', requireAuth, container.updatePostController);
  app.delete('/posts/:id', requireAuth, container.deletePostController);
  app.post('/posts/:id/publish', requireAuth, container.publishPostController);
  app.get(
    '/posts/:id/explain-delete',
    requireAuth,
    container.explainPostDeleteController,
  );

  app.use((req, res) => {
    res.status(404).json({
      error: 'NOT_FOUND',
      message: `No route for ${req.method} ${req.path}`,
    });
  });

  app.use(errorHandler);

  return app;
}
