import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { z } from 'zod';
import type { userRepository } from '../repositories/users';
import type { loginBody, registerBody } from '../validators/auth';
import { toPublicUser } from '../models/user';
import { HttpError } from '../utils/http';
import { signAccessToken, verifyAccessToken } from '../utils/tokens';

const BCRYPT_COST = 12;

export function authService(users: ReturnType<typeof userRepository>, secret: string) {
  // Equalize password verification work for existing and unknown email addresses.
  const dummyHash = bcrypt.hashSync('bav-invalid-account', BCRYPT_COST);

  return {
    async register(input: z.infer<typeof registerBody>) {
      const hash = await bcrypt.hash(input.password, BCRYPT_COST);
      try {
        return await users.create(input.email, input.displayName, hash);
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          throw new HttpError(409, 'Email already registered');
        }
        throw error;
      }
    },
    async login(input: z.infer<typeof loginBody>) {
      const user = await users.findForLogin(input.email);
      const matches = await bcrypt.compare(input.password, user?.passwordHash ?? dummyHash);
      if (!user || !matches) throw new HttpError(401, 'Invalid email or password');
      if (user.status !== 'ACTIVE') throw new HttpError(403, 'Account unavailable');
      return {
        user: toPublicUser(user),
        token: signAccessToken(user.id, user.sessionVersion, secret),
      };
    },
    async authenticate(token: string | undefined) {
      const payload = verifyAccessToken(token, secret);
      const user = await users.findSession(payload.sub);
      if (!user || user.sessionVersion !== payload.version) {
        throw new HttpError(401, 'Session expired or invalid');
      }
      if (user.status !== 'ACTIVE') throw new HttpError(403, 'Account unavailable');
      return user;
    },
    logout(id: string, version: number) {
      return users.revokeSessions(id, version);
    },
  };
}
