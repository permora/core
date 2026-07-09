export type User = { id: string; approvalLimit?: number };
export type Project = { id: string; ownerId: string };
export type Invoice = { id: string; amount: number };
export type Post = { id: string; authorId: string; published: boolean };
