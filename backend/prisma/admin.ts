import { z } from 'zod';
import { createDatabase } from '../src/config/database';
import { loadConfig } from '../src/config/env';

async function promote() {
  const email = z.email().parse(process.argv[2]?.trim().toLowerCase());
  const database = createDatabase(loadConfig().DATABASE_URL);
  try {
    await database.user.update({
      where: { email },
      data: { role: { connect: { name: 'ADMIN' } }, sessionVersion: { increment: 1 } },
      select: { id: true },
    });
    console.info('Role updated. Sign in again to use the admin account.');
  } finally {
    await database.$disconnect();
  }
}

promote().catch(() => {
  console.error(
    'Unable to promote the account. Check the email, registration, migration and environment.',
  );
  process.exitCode = 1;
});
