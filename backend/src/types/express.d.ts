import type { PublicUser } from '../models/user';

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser & { sessionVersion: number };
    }
  }
}

export {};
