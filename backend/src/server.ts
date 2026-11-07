import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createApp } from './app';
import { createDatabase } from './config/database';
import { loadConfig } from './config/env';
import { attachSockets } from './sockets';

async function start() {
  const withoutDatabase = process.argv.includes('--without-database');
  const config = loadConfig(
    withoutDatabase
      ? {
          ...process.env,
          DATABASE_URL: 'postgresql://127.0.0.1/bav_preview',
          JWT_ACCESS_SECRET: randomBytes(32).toString('hex'),
          FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
        }
      : process.env,
  );
  const db = createDatabase(config.DATABASE_URL);
  if (!withoutDatabase) await db.$connect();

  const { app, auth } = createApp(config, db, withoutDatabase);
  const server = createServer(app);
  const sockets = withoutDatabase ? undefined : attachSockets(server, config.FRONTEND_URL, auth);

  server.once('error', async (error) => {
    console.error('HTTP server failed', error.name);
    process.exitCode = 1;
    await db.$disconnect();
  });
  const host = config.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
  server.listen(config.PORT, host, () => {
    console.info(`BAV-Connect API listening on ${host}:${config.PORT}`);
    if (withoutDatabase) console.info('Local preview is running with database features disabled.');
  });

  const stop = async () => {
    const timeout = setTimeout(() => process.exit(1), 10_000).unref();
    try {
      if (sockets) {
        await sockets.close();
      } else {
        await new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        });
      }
      await db.$disconnect();
    } finally {
      clearTimeout(timeout);
    }
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

start().catch((error: unknown) => {
  console.error(
    error instanceof Error && error.message.startsWith('Invalid environment configuration')
      ? error.message
      : 'Unable to start API. Check the database connection and configuration.',
  );
  process.exitCode = 1;
});
