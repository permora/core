import express from 'express';
import { AuthorizationDeniedError } from '@permora/core';
import { tokensByUserId, findPostById, findUserById, posts } from './data.js';
import { authenticate } from './middleware/authenticate.js';
import { authorize, loadPostFromParams } from './middleware/authorize.js';
import { requireAuth } from './middleware/require-auth.js';

const app = express();

function readRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

app.use(express.json());
app.use(authenticate);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/login', (req, res) => {
  const userId = typeof req.body?.userId === 'string' ? req.body.userId : '';
  const user = findUserById(userId);

  if (user === undefined) {
    res.status(404).json({
      error: 'USER_NOT_FOUND',
      message: `Unknown user "${userId}".`,
    });
    return;
  }

  res.json({
    token: tokensByUserId[user.id],
    user,
  });
});

app.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    requestId: req.requestId,
    scope: req.authz?.scope,
    roles: req.authz?.roles,
  });
});

app.get('/posts', requireAuth, authorize('read'), (_req, res) => {
  res.json({ posts });
});

app.post('/posts', requireAuth, authorize('create'), (req, res) => {
  const title =
    typeof req.body?.title === 'string' ? req.body.title : 'Untitled';
  const post = {
    id: `p${posts.length + 1}`,
    authorId: req.user!.id,
    title,
    published: false,
  };

  posts.push(post);
  res.status(201).json({ post });
});

app.patch(
  '/posts/:id',
  requireAuth,
  authorize('update', loadPostFromParams),
  (req, res) => {
    const post = findPostById(readRouteParam(req.params.id))!;
    const title =
      typeof req.body?.title === 'string' ? req.body.title : post.title;

    post.title = title;
    res.json({ post });
  },
);

app.delete(
  '/posts/:id',
  requireAuth,
  authorize('delete', loadPostFromParams),
  (req, res) => {
    const postId = readRouteParam(req.params.id);
    const index = posts.findIndex((post) => post.id === postId);
    const [deleted] = posts.splice(index, 1);

    res.json({ deleted });
  },
);

app.post(
  '/posts/:id/publish',
  requireAuth,
  authorize('publish', loadPostFromParams),
  (req, res) => {
    const post = findPostById(readRouteParam(req.params.id))!;
    post.published = true;

    res.json({ post });
  },
);

app.get('/posts/:id/explain-delete', requireAuth, async (req, res, next) => {
  try {
    if (req.authz === undefined) {
      res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Provide Authorization: Bearer <token>.',
      });
      return;
    }

    const postId = readRouteParam(req.params.id);
    const post = findPostById(postId);
    if (post === undefined) {
      res.status(404).json({
        error: 'POST_NOT_FOUND',
        message: `Post "${postId}" was not found.`,
      });
      return;
    }

    const explanation = await req.authz.explain('post', 'delete', post);
    res.json({ explanation });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: `No route for ${req.method} ${req.path}`,
  });
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof AuthorizationDeniedError) {
      res.status(403).json({
        error: error.code,
        message: error.message,
      });
      return;
    }

    const message = error instanceof Error ? error.message : 'Unexpected error';
    res.status(500).json({
      error: 'INTERNAL_SERVER_ERROR',
      message,
    });
  },
);

const port = Number(process.env.PORT ?? 3001);

app.listen(port, () => {
  console.log(`express-single-tenant listening on http://localhost:${port}`);
});
