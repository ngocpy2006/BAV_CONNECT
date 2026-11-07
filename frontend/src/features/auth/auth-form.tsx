'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { errorMessage } from '@/lib/api';
import { login, register } from '@/services/account';
import { loginSchema, registerSchema } from './schema';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const creating = mode === 'register';
  const [failure, setFailure] = useState('');
  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(creating ? registerSchema : loginSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  return (
    <form
      className="surface max-w-md space-y-4 p-6"
      onSubmit={handleSubmit(async ({ email, password, displayName }) => {
        setFailure('');
        try {
          if (creating) {
            await register({ email, password, displayName });
            router.push('/login?registered=1');
          } else {
            await login({ email, password });
            router.push('/profile');
          }
        } catch (error) {
          setFailure(errorMessage(error));
        }
      })}
      noValidate
    >
      {creating && (
        <label className="block space-y-1 text-sm">
          <span>Tên hiển thị</span>
          <input className="input" autoComplete="name" {...field('displayName')} />
          {errors.displayName && <span role="alert">{errors.displayName.message}</span>}
        </label>
      )}
      <label className="block space-y-1 text-sm">
        <span>Email</span>
        <input className="input" type="email" autoComplete="email" {...field('email')} />
        {errors.email && <span role="alert">{errors.email.message}</span>}
      </label>
      <label className="block space-y-1 text-sm">
        <span>Mật khẩu</span>
        <input
          className="input"
          type="password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          {...field('password')}
        />
        {errors.password && <span role="alert">{errors.password.message}</span>}
      </label>
      {failure && (
        <p role="alert" className="text-sm text-red-700">
          {failure}
        </p>
      )}
      <button className="button" disabled={isSubmitting}>
        {creating ? 'Tạo tài khoản' : 'Đăng nhập'}
      </button>
      <p className="text-sm text-muted">
        {creating ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
        <Link className="text-brand underline" href={creating ? '/login' : '/register'}>
          {creating ? 'Đăng nhập' : 'Đăng ký'}
        </Link>
      </p>
    </form>
  );
}
