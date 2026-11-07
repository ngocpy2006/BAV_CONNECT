import { z } from 'zod';

export const idParam = z.object({ id: z.uuid() });
export const pagingQuery = z.object({
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const postQuery = pagingQuery.extend({
  q: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(80).optional(),
});
export const newPostBody = z.strictObject({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(5000),
  categoryId: z.uuid(),
  price: z.number().int().min(0).max(2_147_483_647).nullable().default(null),
});
