import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  email: true,
  displayName: true,
  status: true,
  role: { select: { name: true } },
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export const sessionUserSelect = {
  ...publicUserSelect,
  sessionVersion: true,
} satisfies Prisma.UserSelect;

export function toPublicUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    role: { name: user.role.name },
  };
}
