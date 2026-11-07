import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Config } from '../config/env';
import type { adminController } from '../controllers/admin';
import type { authController } from '../controllers/auth';
import type { marketplaceController } from '../controllers/marketplace';
import { requireAuth, requireRole } from '../middlewares/auth';
import { pending } from '../middlewares/errors';
import type { authService } from '../services/auth';
import { ok } from '../utils/http';

export function apiRoutes(
  config: Config,
  auth: ReturnType<typeof authService>,
  account: ReturnType<typeof authController>,
  marketplace: ReturnType<typeof marketplaceController>,
  admin: ReturnType<typeof adminController>,
) {
  const router = Router();
  const signedIn = requireAuth(auth);
  const authenticate = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.NODE_ENV === 'test' ? 100 : 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message: 'Too many attempts', errors: [] });
    },
  });

  router.get('/health', (_req, res) => {
    ok(res, { status: 'ok' });
  });
  router.post('/auth/register', authenticate, account.register);
  router.post('/auth/login', authenticate, account.login);
  router.post('/auth/logout', signedIn, account.logout);
  router.get('/users/profile', signedIn, account.profile);
  router.patch('/users/profile', signedIn, pending);

  router.get('/categories', marketplace.categories);
  router.get('/posts', marketplace.published);
  router.get('/posts/mine', signedIn, marketplace.own);
  router.get('/posts/:id', marketplace.detail);
  router.post('/posts', signedIn, marketplace.create);
  router.put('/posts/:id', signedIn, pending);
  router.delete('/posts/:id', signedIn, pending);

  router.get('/posts/:id/comments', pending);
  router.post('/posts/:id/comments', signedIn, pending);
  router.patch('/comments/:id', signedIn, pending);
  router.delete('/comments/:id', signedIn, pending);
  router.get('/conversations', signedIn, pending);
  router.post('/conversations', signedIn, pending);
  router.get('/conversations/:id/messages', signedIn, pending);
  router.post('/conversations/:id/messages', signedIn, pending);
  router.post('/reports', signedIn, pending);

  const adminRouter = Router();
  adminRouter.use(signedIn, requireRole('ADMIN'));
  adminRouter.get('/users', admin.users);
  adminRouter.patch('/users/:id/status', pending);
  adminRouter.get('/posts', pending);
  adminRouter.get('/posts/pending', marketplace.pending);
  adminRouter.patch('/posts/:id/approve', marketplace.moderate('APPROVED'));
  adminRouter.patch('/posts/:id/reject', marketplace.moderate('REJECTED'));
  adminRouter.patch('/posts/:id/hide', pending);
  adminRouter.delete('/posts/:id', pending);
  adminRouter.get('/categories', pending);
  adminRouter.post('/categories', pending);
  adminRouter.patch('/categories/:id', pending);
  adminRouter.delete('/categories/:id', pending);
  adminRouter.delete('/comments/:id', pending);
  adminRouter.get('/reports', pending);
  adminRouter.patch('/reports/:id', pending);
  adminRouter.get('/audit-logs', pending);
  adminRouter.get('/stats', pending);
  router.use('/admin', adminRouter);

  return router;
}
