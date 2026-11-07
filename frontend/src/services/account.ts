import { api } from '@/lib/api';
import type { Account } from '@/types/account';

type Credentials = { email: string; password: string };

export function login(input: Credentials) {
  return api<Account>('/auth/login', { method: 'POST', body: JSON.stringify(input) });
}

export function register(input: Credentials & { displayName: string }) {
  return api<Account>('/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

export function logout() {
  return api<null>('/auth/logout', { method: 'POST' });
}

export function getProfile(signal?: AbortSignal) {
  return api<Account>('/users/profile', { signal });
}
