'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Notice, ResourceError } from '@/components/page';
import { useApiResource } from '@/hooks/use-api-resource';
import { errorMessage } from '@/lib/api';
import { getProfile, logout } from '@/services/account';

export function Profile() {
  const router = useRouter();
  const result = useApiResource(getProfile);
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  if (result.state === 'loading') return <Notice>Đang tải tài khoản…</Notice>;
  if (result.state === 'error') return <ResourceError error={result.error} />;
  const account = result.data;

  return (
    <div className="surface max-w-md space-y-3 p-6">
      <p className="text-lg font-semibold">{account.displayName}</p>
      <p className="text-sm text-muted">{account.email}</p>
      {account.role.name === 'ADMIN' && (
        <Link href="/admin" className="block text-sm text-brand underline">
          Quản trị
        </Link>
      )}
      <button
        className="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setFailure('');
          try {
            await logout();
            router.push('/login');
          } catch (error) {
            setFailure(errorMessage(error));
            setBusy(false);
          }
        }}
      >
        Đăng xuất
      </button>
      {failure && (
        <p className="text-sm text-red-700" role="alert">
          {failure}
        </p>
      )}
    </div>
  );
}
