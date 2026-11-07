import Link from 'next/link';
import { Notice } from '@/components/page';
import type { Post } from '@/types/marketplace';

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function showPrice(value: number | null) {
  return value === null ? 'Liên hệ để biết giá' : vnd.format(value);
}

export function PostList({ posts }: { posts: Post[] }) {
  if (!posts.length) return <Notice>Chưa có tin phù hợp.</Notice>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <Link
            href={`/marketplace/${post.id}`}
            className="surface block h-full space-y-2 p-5 hover:border-brand"
          >
            <p className="text-sm font-medium text-brand">{post.category.name}</p>
            <h3 className="line-clamp-2 font-semibold">{post.title}</h3>
            <p className="line-clamp-2 text-sm text-muted">{post.description}</p>
            <p className="font-semibold">{showPrice(post.price)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
