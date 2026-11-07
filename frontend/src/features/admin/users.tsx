'use client';

import { Notice, ResourceError } from '@/components/page';
import { useApiResource } from '@/hooks/use-api-resource';
import { getUsers } from '@/services/admin';

export function AdminUsers() {
  const result = useApiResource(getUsers);
  if (result.state === 'loading') return <Notice>Đang tải người dùng…</Notice>;
  if (result.state === 'error') return <ResourceError error={result.error} />;
  if (!result.data.length) return <Notice>Chưa có tài khoản.</Notice>;
  return (
    <ul className="space-y-3">
      {result.data.map(({ id, displayName, email, role, status }) => (
        <li className="surface flex flex-wrap justify-between gap-2 p-4" key={id}>
          <div>
            <p className="font-semibold">{displayName}</p>
            <p className="text-sm text-muted">{email}</p>
          </div>
          <p className="text-sm text-muted">
            {role.name} · {status}
          </p>
        </li>
      ))}
    </ul>
  );
}
