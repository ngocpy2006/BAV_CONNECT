import Link from 'next/link';
import type { ReactNode } from 'react';
import { ApiError, errorMessage } from '@/lib/api';

export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="wrap space-y-6 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {children}
    </section>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return <div className="surface p-5 text-sm text-muted">{children}</div>;
}

export function ResourceError({ error }: { error: unknown }) {
  if (error instanceof ApiError && error.status === 401) {
    return (
      <Notice>
        Vui lòng{' '}
        <Link className="text-brand underline" href="/login">
          đăng nhập
        </Link>{' '}
        để tiếp tục.
      </Notice>
    );
  }
  return <Notice>{errorMessage(error)}</Notice>;
}
