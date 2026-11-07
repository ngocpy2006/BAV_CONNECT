import { api } from '@/lib/api';
import type { Category, Post } from '@/types/marketplace';

export function getCategories(signal?: AbortSignal) {
  return api<Category[]>('/categories', { signal });
}

export function getPosts(
  query: { q?: string; category?: string; limit?: number; page?: number } = {},
) {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.page) params.set('page', String(query.page));
  return api<Post[]>(`/posts?${params.toString()}`);
}

export function getPost(id: string) {
  return api<Post>(`/posts/${encodeURIComponent(id)}`);
}

export function getOwnPosts(signal?: AbortSignal) {
  return api<Post[]>('/posts/mine', { signal });
}

export function createPost(input: {
  title: string;
  description: string;
  categoryId: string;
  price: number | null;
}) {
  return api<Post>('/posts', { method: 'POST', body: JSON.stringify(input) });
}
