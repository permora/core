export class PostNotFoundError extends Error {
  constructor(postId: string) {
    super(`Post "${postId}" was not found.`);
    this.name = 'PostNotFoundError';
  }
}
