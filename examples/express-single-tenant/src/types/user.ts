export type Role = 'viewer' | 'editor' | 'admin';

export type User = {
  id: string;
  name: string;
  roles: Role[];
};
