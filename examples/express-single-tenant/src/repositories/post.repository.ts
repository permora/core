import type { Post } from '../types/post.js';

export type CreatePostInput = {
  authorId: string;
  title: string;
};

export type PostRepository = {
  findAll(): Post[];
  findById(postId: string): Post | undefined;
  create(input: CreatePostInput): Post;
  updateTitle(postId: string, title: string): Post | undefined;
  publish(postId: string): Post | undefined;
  delete(postId: string): Post | undefined;
};

export function createInMemoryPostRepository(
  seedPosts: readonly Post[],
): PostRepository {
  const posts = [...seedPosts];

  return {
    findAll() {
      return [...posts];
    },
    findById(postId) {
      return posts.find((post) => post.id === postId);
    },
    create(input) {
      const post = {
        id: `p${posts.length + 1}`,
        authorId: input.authorId,
        title: input.title,
        published: false,
      } satisfies Post;
      posts.push(post);
      return post;
    },
    updateTitle(postId, title) {
      const post = posts.find((item) => item.id === postId);
      if (post === undefined) {
        return undefined;
      }
      post.title = title;
      return post;
    },
    publish(postId) {
      const post = posts.find((item) => item.id === postId);
      if (post === undefined) {
        return undefined;
      }
      post.published = true;
      return post;
    },
    delete(postId) {
      const index = posts.findIndex((post) => post.id === postId);
      if (index === -1) {
        return undefined;
      }
      const [deleted] = posts.splice(index, 1);
      return deleted;
    },
  };
}
