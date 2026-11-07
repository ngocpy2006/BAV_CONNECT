'use client';

import { useState } from 'react';
import { Notice, ResourceError } from '@/components/page';
import { useApiResource } from '@/hooks/use-api-resource';
import { errorMessage } from '@/lib/api';
import { getPendingPosts, moderatePost } from '@/services/admin';

export function Moderation() {
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const result = useApiResource(getPendingPosts);
  const [resolved, setResolved] = useState<string[]>([]);
  const pending =
    result.state === 'ready' ? result.data.filter(({ id }) => !resolved.includes(id)) : [];
  if (result.state === 'loading') return <Notice>Đang tải tin chờ duyệt…</Notice>;
  if (result.state === 'error') return <ResourceError error={result.error} />;

  async function decide(id: string, decision: 'approve' | 'reject') {
    setBusy(true);
    setFailure('');
    try {
      await moderatePost(id, decision);
      setResolved((ids) => [...ids, id]);
    } catch (error) {
      setFailure(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {failure && (
        <p className="text-sm text-red-700" role="alert">
          {failure}
        </p>
      )}
      {pending.length ? (
        <ul className="space-y-3">
          {pending.map(({ id, title, author, description }) => (
            <li className="surface space-y-2 p-4" key={id}>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted">{author.displayName}</p>
              <p className="whitespace-pre-wrap break-words">{description}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => void decide(id, 'approve')}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  className="button"
                  disabled={busy}
                  onClick={() => void decide(id, 'reject')}
                >
                  Từ chối
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <Notice>Chưa có tin chờ duyệt trong danh sách đã tải.</Notice>
      )}
    </>
  );
}
