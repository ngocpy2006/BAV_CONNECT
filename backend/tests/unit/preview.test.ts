import { randomBytes } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { createDatabase } from '../../src/config/database';
import { loadConfig } from '../../src/config/env';

const config = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://127.0.0.1:1/unreachable',
  JWT_ACCESS_SECRET: randomBytes(32).toString('hex'),
  FRONTEND_URL: 'http://localhost:3000',
});

describe('database-free preview', () => {
  it('serves health and returns 503 for database routes without connecting', async () => {
    const db = createDatabase(config.DATABASE_URL);
    try {
      const { app } = createApp(config, db, true);
      await request(app).get('/api/v1/health').expect(200);
      const posts = await request(app).get('/api/v1/posts').expect(503);
      expect(posts.body.success).toBe(false);
      await request(app).post('/api/v1/auth/register').send({}).expect(503);
    } finally {
      await db.$disconnect();
    }
  });

  it('rejects preview mode in production', () => {
    const db = createDatabase(config.DATABASE_URL);
    expect(() => createApp({ ...config, NODE_ENV: 'production' }, db, true)).toThrow(
      'only available for local development',
    );
  });
});
