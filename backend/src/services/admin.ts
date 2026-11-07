import type { z } from 'zod';
import type { userRepository } from '../repositories/users';
import type { pagingQuery } from '../validators/marketplace';
import { pageOffset } from './marketplace';

export function adminService(users: ReturnType<typeof userRepository>) {
  return {
    users(query: z.infer<typeof pagingQuery>) {
      return users.list(pageOffset(query), query.limit);
    },
  };
}
