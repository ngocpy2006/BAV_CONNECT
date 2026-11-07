import type { RoleName } from '@prisma/client';
import type { Request, RequestHandler } from 'express';
import { ACCESS_COOKIE } from '../constants/auth';
import type { authService } from '../services/auth';
import { HttpError } from '../utils/http';

export function requireAuth(auth: ReturnType<typeof authService>): RequestHandler {
  return async (req, _res, next) => {
    const token: unknown = req.cookies[ACCESS_COOKIE];
    req.user = await auth.authenticate(typeof token === 'string' ? token : undefined);
    next();
  };
}

export function currentUser(req: Request) {
  if (!req.user) throw new HttpError(401, 'Authentication required');
  return req.user;
}

export function requireRole(...roles: RoleName[]): RequestHandler {
  return (req, _res, next) => {
    if (!roles.includes(currentUser(req).role.name)) {
      throw new HttpError(403, 'Insufficient permissions');
    }
    next();
  };
}

export function trustedOrigin(origin: string): RequestHandler {
  return (req, _res, next) => {
    const requestOrigin = req.get('origin');
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      ((requestOrigin && requestOrigin !== origin) || req.get('sec-fetch-site') === 'cross-site')
    ) {
      throw new HttpError(403, 'Untrusted request origin');
    }
    next();
  };
}
