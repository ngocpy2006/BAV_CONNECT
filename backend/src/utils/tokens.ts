import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { ACCESS_SECONDS, TOKEN_AUDIENCE, TOKEN_ISSUER } from '../constants/auth';
import { HttpError } from './http';

const claims = z.object({
  sub: z.uuid(),
  version: z.number().int().nonnegative(),
  exp: z.number(),
});

export function signAccessToken(id: string, version: number, secret: string): string {
  return jwt.sign({ version }, secret, {
    algorithm: 'HS256',
    subject: id,
    issuer: TOKEN_ISSUER,
    audience: TOKEN_AUDIENCE,
    expiresIn: ACCESS_SECONDS,
  });
}

export function verifyAccessToken(token: string | undefined, secret: string) {
  if (!token) throw new HttpError(401, 'Authentication required');
  try {
    return claims.parse(
      jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: TOKEN_ISSUER,
        audience: TOKEN_AUDIENCE,
      }),
    );
  } catch {
    throw new HttpError(401, 'Session expired or invalid');
  }
}
