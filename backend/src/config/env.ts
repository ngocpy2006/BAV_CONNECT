import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    JWT_ACCESS_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.union([z.literal(''), z.string().min(32)]).optional(),
    FRONTEND_URL: z
      .url({ protocol: /^https?$/ })
      .refine((value) => new URL(value).origin === value, {
        message: 'Use an origin without a trailing slash or path',
      }),
  })
  .refine((value) => value.NODE_ENV !== 'production' || value.FRONTEND_URL.startsWith('https://'), {
    path: ['FRONTEND_URL'],
    message: 'Production requires HTTPS',
  });

export type Config = z.infer<typeof envSchema>;

export function loadConfig(input: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`);
    throw new Error(`Invalid environment configuration. ${issues.join('; ')}`);
  }
  return parsed.data;
}
