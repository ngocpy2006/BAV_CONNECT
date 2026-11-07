import type { z } from 'zod';
import type { marketplaceRepository } from '../repositories/marketplace';
import { HttpError } from '../utils/http';
import type { newPostBody, pagingQuery, postQuery } from '../validators/marketplace';

export function pageOffset(query: z.infer<typeof pagingQuery>) {
  return (query.page - 1) * query.limit;
}

export function marketplaceService(repository: ReturnType<typeof marketplaceRepository>) {
  return {
    categories: repository.categories,
    published(query: z.infer<typeof postQuery>) {
      return repository.listPublished(pageOffset(query), query.limit, query.q, query.category);
    },
    own(authorId: string, query: z.infer<typeof pagingQuery>) {
      return repository.listOwn(authorId, pageOffset(query), query.limit);
    },
    pending(query: z.infer<typeof pagingQuery>) {
      return repository.listPending(pageOffset(query), query.limit);
    },
    async findPublished(id: string) {
      const post = await repository.findPublished(id);
      if (!post) throw new HttpError(404, 'Post not found');
      return post;
    },
    async create(authorId: string, input: z.infer<typeof newPostBody>) {
      const post = await repository.create({ ...input, authorId });
      if (!post) throw new HttpError(422, 'Category unavailable');
      return post;
    },
    async moderate(id: string, actorId: string, status: 'APPROVED' | 'REJECTED') {
      const post = await repository.moderate(id, actorId, status);
      if (!post) throw new HttpError(409, 'Post is not awaiting moderation');
      return post;
    },
  };
}
