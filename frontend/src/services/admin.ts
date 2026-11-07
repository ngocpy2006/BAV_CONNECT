import { api } from '@/lib/api';
import type { Account } from '@/types/account';
import type { Post } from '@/types/marketplace';

export function getUsers(signal?: AbortSignal) {
  return api<Account[]>('/admin/users', { signal });
}

export function getPendingPosts(signal?: AbortSignal) {
  return api<Post[]>('/admin/posts/pending', { signal });
}

export function moderatePost(id: string, decision: 'approve' | 'reject') {
  return api<Post>(`/admin/posts/${encodeURIComponent(id)}/${decision}`, { method: 'PATCH' });
}
