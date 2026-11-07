import type { PrismaClient } from '@prisma/client';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import type { Config } from './config/env';
import { adminController } from './controllers/admin';
import { authController } from './controllers/auth';
import { marketplaceController } from './controllers/marketplace';
import { trustedOrigin } from './middlewares/auth';
import { handleError, notFound } from './middlewares/errors';
import { marketplaceRepository } from './repositories/marketplace';
import { userRepository } from './repositories/users';
import { apiRoutes } from './routes';
import { adminService } from './services/admin';
import { authService } from './services/auth';
import { marketplaceService } from './services/marketplace';
import { HttpError } from './utils/http';

export function createApp(config: Config, database: PrismaClient, withoutDatabase = false) {
  if (withoutDatabase && config.NODE_ENV === 'production') {
    throw new Error('Database-free preview is only available for local development');
  }
  const app = express();
  const users = userRepository(database);
  const auth = authService(users, config.JWT_ACCESS_SECRET);
  const account = authController(auth, config.NODE_ENV === 'production');
  const marketplace = marketplaceController(marketplaceService(marketplaceRepository(database)));
  const admin = adminController(adminService(users));

  app.disable('x-powered-by');
  app.use(helmet());
  if (config.NODE_ENV !== 'test') {
    // Keep query strings, headers and bodies out of access logs.
    app.use(morgan(':method :status :response-time ms'));
  }
  app.use(cors({ origin: config.FRONTEND_URL, credentials: true }));
  app.use(trustedOrigin(config.FRONTEND_URL));
  app.use(express.json({ limit: '64kb' }));
  app.use(cookieParser());
  app.use(
    '/api/v1',
    (_req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
    (req, _res, next) => {
      if (withoutDatabase && !(req.method === 'GET' && req.path === '/health')) {
        throw new HttpError(503, 'Chế độ xem trước đang tắt cơ sở dữ liệu.');
      }
      next();
    },
    apiRoutes(config, auth, account, marketplace, admin),
  );
  app.use(notFound);
  app.use(handleError);
  return { app, auth };
}
