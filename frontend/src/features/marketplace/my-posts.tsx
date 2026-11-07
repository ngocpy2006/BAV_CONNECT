'use client';

import Link from 'next/link';
import { Notice, ResourceError } from '@/components/page';
import { useApiResource } from '@/hooks/use-api-resource';
import { getOwnPosts } from '@/services/marketplace';
import type { PostStatus } from '@/types/marketplace';

const statuses: Record<PostStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  HIDDEN: 'Đã ẩn',
  SOLD: 'Đã bán',
};

export function MyPosts() {
  const result = useApiResource(getOwnPosts);
  if (result.state === 'loading') return <Notice>Đang tải tin…</Notice>;
  if (result.state === 'error') return <ResourceError error={result.error} />;
  if (!result.data.length) return <Notice>Bạn chưa có tin đăng.</Notice>;
  return (
    <ul className="space-y-3">
      {result.data.map(({ id, title, status, category }) => (
        <li key={id} className="surface flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <p className="text-sm text-muted">{category.name}</p>
            {status === 'APPROVED' ? (
              <Link className="font-semibold text-brand" href={`/marketplace/${id}`}>
                {title}
              </Link>
            ) : (
              <p className="font-semibold">{title}</p>
            )}
          </div>
          <span className="rounded-full bg-mint px-3 py-1 text-sm">{statuses[status]}</span>
        </li>
      ))}
    </ul>
  );
}
