export type Account = {
  id: string;
  email: string;
  displayName: string;
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE';
  role: { name: 'ADMIN' | 'USER' };
};
