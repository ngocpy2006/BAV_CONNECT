import { z } from 'zod';

const email = z.string().trim().toLowerCase().max(254).pipe(z.email());
const password = z
  .string()
  .min(8)
  .max(72)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    'Password must be at most 72 UTF-8 bytes',
  );

export const loginBody = z.strictObject({ email, password });
export const registerBody = loginBody.extend({ displayName: z.string().trim().min(2).max(80) });
