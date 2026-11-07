import Link from 'next/link';
import { Notice, Page } from '@/components/page';
import { SearchForm } from '@/components/search-form';
import { PostList } from '@/features/marketplace/post-list';
import { getPosts } from '@/services/marketplace';

export const dynamic = 'force-dynamic';

const pageSize = 20;

type Params = { q?: string | string[]; category?: string | string[]; page?: string | string[] };

export default async function Marketplace({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 120) : undefined;
  const category =
    typeof params.category === 'string' ? params.category.trim().slice(0, 80) : undefined;
  const requestedPage = Number(params.page);
  const page =
    Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 1000
      ? requestedPage
      : 1;
  const posts = await getPosts({ q, category, page, limit: pageSize }).catch(() => null);

  function pageHref(target: number) {
    const query = new URLSearchParams({ page: String(target) });
    if (q) query.set('q', q);
    if (category) query.set('category', category);
    return `/marketplace?${query.toString()}`;
  }

  return (
    <Page title="Chợ sinh viên">
      <SearchForm query={q} category={category} />
      {category && (
        <Link href="/marketplace" className="text-sm text-brand underline">
          Bỏ lọc danh mục
        </Link>
      )}
      {posts ? <PostList posts={posts} /> : <Notice>Chưa tải được tin đăng.</Notice>}
      {posts && (page > 1 || posts.length === pageSize) && (
        <nav aria-label="Phân trang" className="flex gap-4 text-sm text-brand">
          {page > 1 && <Link href={pageHref(page - 1)}>Trang trước</Link>}
          <span>Trang {page}</span>
          {posts.length === pageSize && page < 1000 && (
            <Link href={pageHref(page + 1)}>Trang sau</Link>
          )}
        </nav>
      )}
    </Page>
  );
}
