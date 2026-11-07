import { PrismaClient } from '@prisma/client';

export function createDatabase(url: string) {
  return new PrismaClient({ datasourceUrl: url });
}
