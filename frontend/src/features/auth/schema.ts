import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(254).pipe(z.email('Email không hợp lệ.'));
const password = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự.')
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    'Mật khẩu tối đa 72 byte UTF-8.',
  );
const displayName = z.string().trim().min(2, 'Nhập ít nhất 2 ký tự.').max(80);

export const loginSchema = z.object({ email, password, displayName: z.string() });
export const registerSchema = loginSchema.extend({ displayName });
