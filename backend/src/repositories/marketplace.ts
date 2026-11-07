import type { PostStatus, Prisma, PrismaClient } from '@prisma/client';

const postSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, displayName: true } },
  images: { select: { id: true, url: true }, orderBy: { position: 'asc' } },
} satisfies Prisma.PostSelect;

export function marketplaceRepository(db: PrismaClient) {
  const visible: Prisma.PostWhereInput = {
    status: 'APPROVED',
    deletedAt: null,
    category: { active: true },
    author: { status: 'ACTIVE' },
  };

  return {
    categories() {
      return db.category.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      });
    },
    findPublished(id: string) {
      return db.post.findFirst({ where: { id, ...visible }, select: postSelect });
    },
    listPublished(skip: number, take: number, q?: string, category?: string) {
      return db.post.findMany({
        where: {
          ...visible,
          ...(category && { category: { active: true, slug: category } }),
          ...(q && {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
            ],
          }),
        },
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: postSelect,
      });
    },
    listOwn(authorId: string, skip: number, take: number) {
      return db.post.findMany({
        where: { authorId, deletedAt: null },
        skip,
        take,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: postSelect,
      });
    },
    listPending(skip: number, take: number) {
      return db.post.findMany({
        where: { status: 'PENDING', deletedAt: null },
        skip,
        take,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: postSelect,
      });
    },
    async create(
      data: Pick<
        Prisma.PostUncheckedCreateInput,
        'title' | 'description' | 'price' | 'categoryId' | 'authorId'
      >,
    ) {
      return db.$transaction(async (tx) => {
        const category = await tx.category.findFirst({
          where: { id: data.categoryId, active: true },
        });
        if (!category) return null;
        return tx.post.create({ data, select: postSelect });
      });
    },
    moderate(id: string, actorId: string, status: Extract<PostStatus, 'APPROVED' | 'REJECTED'>) {
      return db.$transaction(async (tx) => {
        const change = await tx.post.updateMany({
          where: { id, status: 'PENDING', deletedAt: null },
          data: { status },
        });
        if (!change.count) return null;
        await tx.auditLog.create({
          data: { actorId, action: `POST_${status}`, entityType: 'Post', entityId: id },
        });
        return tx.post.findUniqueOrThrow({ where: { id }, select: postSelect });
      });
    },
  };
}
