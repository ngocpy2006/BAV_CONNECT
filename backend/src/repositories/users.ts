import type { PrismaClient } from '@prisma/client';
import { publicUserSelect, sessionUserSelect } from '../models/user';

export function userRepository(db: PrismaClient) {
  return {
    create(email: string, displayName: string, passwordHash: string) {
      return db.user.create({
        data: { email, displayName, passwordHash, role: { connect: { name: 'USER' } } },
        select: publicUserSelect,
      });
    },
    findForLogin(email: string) {
      return db.user.findUnique({
        where: { email },
        select: { ...sessionUserSelect, passwordHash: true },
      });
    },
    findSession(id: string) {
      return db.user.findUnique({ where: { id }, select: sessionUserSelect });
    },
    revokeSessions(id: string, version: number) {
      return db.user.updateMany({
        where: { id, sessionVersion: version },
        data: { sessionVersion: { increment: 1 } },
      });
    },
    list(skip: number, take: number) {
      return db.user.findMany({
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: publicUserSelect,
      });
    },
  };
}
