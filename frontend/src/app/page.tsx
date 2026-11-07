import Link from 'next/link';
import { Notice } from '@/components/page';
import { SearchForm } from '@/components/search-form';
import { Categories } from '@/features/marketplace/categories';
import { PostList } from '@/features/marketplace/post-list';
import { getCategories, getPosts } from '@/services/marketplace';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [categories, posts] = await Promise.allSettled([getCategories(), getPosts({ limit: 6 })]);

  return (
    <div className="wrap space-y-9 py-7 sm:py-10">
      <section className="rounded-3xl border border-line bg-mint p-6 sm:p-12">
        <p className="mb-3 text-sm font-semibold text-brand">Chợ sinh viên Học viện Ngân hàng</p>
        <h1 className="max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">
          Đồ dùng cũ, thêm một vòng đời.
        </h1>
        <p className="mb-6 mt-4 max-w-lg text-muted">
          Tìm giáo trình, đồ dùng học tập và vật dụng sinh hoạt từ cộng đồng sinh viên BAV.
        </p>
        <SearchForm />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Danh mục sản phẩm</h2>
        {categories.status === 'fulfilled' ? (
          <Categories categories={categories.value} />
        ) : (
          <Notice>Chưa tải được danh mục.</Notice>
        )}
      </section>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Tin đăng mới nhất</h2>
          <Link href="/marketplace" className="text-sm font-semibold text-brand underline">
            Xem chợ sinh viên
          </Link>
        </div>
        {posts.status === 'fulfilled' ? (
          <PostList posts={posts.value} />
        ) : (
          <Notice>Chưa tải được tin đăng.</Notice>
        )}
      </section>
    </div>
  );
}
