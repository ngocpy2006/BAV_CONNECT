import Link from 'next/link';
import { Notice } from '@/components/page';
import type { Category } from '@/types/marketplace';

export function Categories({ categories }: { categories: Category[] }) {
  if (!categories.length) return <Notice>Chưa có danh mục đang hoạt động.</Notice>;
  return (
    <ul className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <li key={category.id}>
          <Link
            className="surface inline-block px-4 py-2 text-sm hover:border-brand hover:text-brand"
            href={`/marketplace?category=${encodeURIComponent(category.slug)}`}
          >
            {category.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
