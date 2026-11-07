import { z } from 'zod';

const apiUrlSchema = z.url({ protocol: /^https?$/ });
const fallbackUrl = 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type ApiBody<T> =
  | { success: true; message: string; data: T }
  | { success: false; message: string; errors: unknown[] };

export function apiUrl(path: string, base = process.env.NEXT_PUBLIC_API_URL || fallbackUrl) {
  const url = apiUrlSchema.parse(base);
  return `${url.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
    cache: 'no-store',
    signal: init.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(5000)])
      : AbortSignal.timeout(5000),
  });
  const body = (await response.json().catch(() => null)) as ApiBody<T> | null;
  if (!response.ok || !body?.success) {
    throw new ApiError(response.status, body?.message || 'Không thể kết nối với API.');
  }
  return body.data;
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Không thể kết nối với máy chủ. Hãy thử lại.';
}
