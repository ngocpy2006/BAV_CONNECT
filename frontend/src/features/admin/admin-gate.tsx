'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Notice, ResourceError } from '@/components/page';
import { adminNavigation } from '@/constants/navigation';
import { useApiResource } from '@/hooks/use-api-resource';
import { getProfile } from '@/services/account';

export function AdminGate({ children }: { children: ReactNode }) {
  const result = useApiResource(getProfile);
  if (result.state === 'loading')
    return (
      <div className="wrap py-8">
        <Notice>Đang kiểm tra quyền truy cập…</Notice>
      </div>
    );
  if (result.state === 'error')
    return (
      <div className="wrap py-8">
        <ResourceError error={result.error} />
      </div>
    );
  if (result.data.role.name !== 'ADMIN')
    return (
      <div className="wrap py-8">
        <Notice>Tài khoản này không có quyền quản trị.</Notice>
      </div>
    );
  return (
    <>
      <nav
        className="wrap flex flex-wrap gap-4 pt-6 text-sm text-brand"
        aria-label="Điều hướng quản trị"
      >
        <Link href="/admin">Tổng quan</Link>
        {adminNavigation.map(({ href, title }) => (
          <Link key={href} href={href}>
            {title}
          </Link>
        ))}
      </nav>
      {children}
    </>
  );
}
