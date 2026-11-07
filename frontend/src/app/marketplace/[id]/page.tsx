import { notFound } from 'next/navigation';
import { z } from 'zod';
import { Notice, Page } from '@/components/page';
import { showPrice } from '@/features/marketplace/post-list';
import { ApiError } from '@/lib/api';
import { getPost } from '@/services/marketplace';

export const dynamic = 'force-dynamic';

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const post = await getPost(id).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) notFound();
    return null;
  });

  if (!post)
    return (
      <Page title="Chi tiết tin đăng">
        <Notice>Chưa tải được tin đăng.</Notice>
      </Page>
    );
  return (
    <Page title={post.title}>
      <article className="surface max-w-2xl space-y-4 p-6">
        <p className="text-sm text-muted">
          {post.category.name} · {post.author.displayName}
        </p>
        <p className="text-xl font-semibold text-brand">{showPrice(post.price)}</p>
        <p className="whitespace-pre-wrap break-words">{post.description}</p>
      </article>
    </Page>
  );
}
