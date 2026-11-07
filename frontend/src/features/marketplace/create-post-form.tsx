'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Notice, ResourceError } from '@/components/page';
import { useApiResource } from '@/hooks/use-api-resource';
import { errorMessage } from '@/lib/api';
import { getProfile } from '@/services/account';
import { createPost, getCategories } from '@/services/marketplace';

const schema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề cần ít nhất 3 ký tự.').max(120),
  description: z.string().trim().min(10, 'Mô tả cần ít nhất 10 ký tự.').max(5000),
  categoryId: z.uuid('Chọn một danh mục.'),
  price: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || (/^\d+$/.test(value) && Number(value) <= 2_147_483_647),
      'Nhập giá nguyên từ 0 đến 2.147.483.647 đồng.',
    ),
});

export function CreatePostForm() {
  const router = useRouter();
  const session = useApiResource(getProfile);
  const categories = useApiResource(getCategories);
  const [failure, setFailure] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', price: '', categoryId: '' },
  });

  if (session.state === 'error') return <ResourceError error={session.error} />;
  if (categories.state === 'error') return <ResourceError error={categories.error} />;
  if (session.state === 'loading' || categories.state === 'loading')
    return <Notice>Đang tải…</Notice>;
  if (!categories.data.length) return <Notice>Chưa có danh mục để đăng tin.</Notice>;

  return (
    <form
      className="surface max-w-xl space-y-4 p-6"
      onSubmit={handleSubmit(async ({ price, ...input }) => {
        setFailure('');
        try {
          await createPost({ ...input, price: price === '' ? null : Number(price) });
          router.push('/my-posts');
        } catch (error) {
          setFailure(errorMessage(error));
        }
      })}
      noValidate
    >
      <label className="block space-y-1 text-sm">
        <span>Tiêu đề</span>
        <input className="input" maxLength={120} {...register('title')} />
        {errors.title && <span role="alert">{errors.title.message}</span>}
      </label>
      <label className="block space-y-1 text-sm">
        <span>Danh mục</span>
        <select className="input" {...register('categoryId')}>
          <option value="">Chọn danh mục</option>
          {categories.data.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        {errors.categoryId && <span role="alert">{errors.categoryId.message}</span>}
      </label>
      <label className="block space-y-1 text-sm">
        <span>Mô tả</span>
        <textarea className="input" rows={5} maxLength={5000} {...register('description')} />
        {errors.description && <span role="alert">{errors.description.message}</span>}
      </label>
      <label className="block space-y-1 text-sm">
        <span>Giá (VND, tùy chọn)</span>
        <input className="input" inputMode="numeric" {...register('price')} />
        {errors.price && <span role="alert">{errors.price.message}</span>}
      </label>
      {failure && (
        <p role="alert" className="text-sm text-red-700">
          {failure}
        </p>
      )}
      <button className="button" disabled={isSubmitting}>
        Gửi duyệt
      </button>
    </form>
  );
}
