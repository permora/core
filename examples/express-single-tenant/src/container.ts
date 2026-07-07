import { authz } from './auth/authz.js';
import { createTokenService } from './auth/token.service.js';
import { createCreatePostController } from './controllers/create-post.controller.js';
import { createDeletePostController } from './controllers/delete-post.controller.js';
import { createExplainPostDeleteController } from './controllers/explain-post-delete.controller.js';
import { createGetMeController } from './controllers/get-me.controller.js';
import { createListPostsController } from './controllers/list-posts.controller.js';
import { createLoginController } from './controllers/login.controller.js';
import { createPublishPostController } from './controllers/publish-post.controller.js';
import { createUpdatePostController } from './controllers/update-post.controller.js';
import {
  createInMemoryPostRepository,
  type PostRepository,
} from './repositories/post.repository.js';
import {
  createInMemoryUserRepository,
  type UserRepository,
} from './repositories/user.repository.js';
import {
  createAuthenticationService,
  type AuthenticationService,
} from './services/authentication.service.js';
import { createCreatePostUseCase } from './use-cases/create-post.use-case.js';
import { createDeletePostUseCase } from './use-cases/delete-post.use-case.js';
import { createExplainPostDeleteUseCase } from './use-cases/explain-post-delete.use-case.js';
import { createGetMeUseCase } from './use-cases/get-me.use-case.js';
import { createListPostsUseCase } from './use-cases/list-posts.use-case.js';
import { createLoginUseCase } from './use-cases/login.use-case.js';
import { createPublishPostUseCase } from './use-cases/publish-post.use-case.js';
import { createUpdatePostUseCase } from './use-cases/update-post.use-case.js';
import type { Post } from './types/post.js';
import type { User } from './types/user.js';

const seedUsers: User[] = [
  { id: 'u1', name: 'Alice Viewer', roles: ['viewer'] },
  { id: 'u2', name: 'Bob Editor', roles: ['editor'] },
  { id: 'u3', name: 'Carol Admin', roles: ['admin'] },
];

const seedPosts: Post[] = [
  {
    id: 'p1',
    authorId: 'u2',
    title: 'Editor owned draft',
    published: false,
  },
  {
    id: 'p2',
    authorId: 'u1',
    title: 'Viewer owned post',
    published: true,
  },
];

const tokenByUserId: Record<string, string> = {
  u1: 'token-viewer',
  u2: 'token-editor',
  u3: 'token-admin',
};

export type AppContainer = {
  authz: typeof authz;
  userRepository: UserRepository;
  postRepository: PostRepository;
  authenticationService: AuthenticationService;
  loginController: ReturnType<typeof createLoginController>;
  getMeController: ReturnType<typeof createGetMeController>;
  listPostsController: ReturnType<typeof createListPostsController>;
  createPostController: ReturnType<typeof createCreatePostController>;
  updatePostController: ReturnType<typeof createUpdatePostController>;
  deletePostController: ReturnType<typeof createDeletePostController>;
  publishPostController: ReturnType<typeof createPublishPostController>;
  explainPostDeleteController: ReturnType<
    typeof createExplainPostDeleteController
  >;
};

export function createAppContainer(): AppContainer {
  const userRepository = createInMemoryUserRepository(seedUsers);
  const postRepository = createInMemoryPostRepository(seedPosts);
  const tokenService = createTokenService(tokenByUserId);
  const authenticationService = createAuthenticationService({
    authz,
    userRepository,
    tokenService,
  });

  const loginUseCase = createLoginUseCase({ tokenService, userRepository });
  const getMeUseCase = createGetMeUseCase();
  const listPostsUseCase = createListPostsUseCase({ postRepository });
  const createPostUseCase = createCreatePostUseCase({ postRepository });
  const updatePostUseCase = createUpdatePostUseCase({ postRepository });
  const deletePostUseCase = createDeletePostUseCase({ postRepository });
  const publishPostUseCase = createPublishPostUseCase({ postRepository });
  const explainPostDeleteUseCase = createExplainPostDeleteUseCase();

  return {
    authz,
    userRepository,
    postRepository,
    authenticationService,
    loginController: createLoginController({ loginUseCase }),
    getMeController: createGetMeController({ getMeUseCase }),
    listPostsController: createListPostsController({ listPostsUseCase }),
    createPostController: createCreatePostController({ createPostUseCase }),
    updatePostController: createUpdatePostController({
      postRepository,
      updatePostUseCase,
    }),
    deletePostController: createDeletePostController({
      postRepository,
      deletePostUseCase,
    }),
    publishPostController: createPublishPostController({
      postRepository,
      publishPostUseCase,
    }),
    explainPostDeleteController: createExplainPostDeleteController({
      postRepository,
      explainPostDeleteUseCase,
    }),
  };
}
