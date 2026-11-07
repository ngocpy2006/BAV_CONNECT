import type { RequestHandler } from 'express';
import type { adminService } from '../services/admin';
import { ok } from '../utils/http';
import { pagingQuery } from '../validators/marketplace';

export function adminController(admin: ReturnType<typeof adminService>) {
  const users: RequestHandler = async (req, res) => {
    ok(res, await admin.users(pagingQuery.parse(req.query)));
  };
  return { users };
}
