import { randomBytes, randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as connectSocket, type Socket } from 'socket.io-client';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app';
import { createDatabase } from '../../src/config/database';
import { loadConfig } from '../../src/config/env';
import { attachSockets } from '../../src/sockets';

const url = process.env.TEST_DATABASE_URL;
if (!url || new URL(url).searchParams.get('schema') !== 'bav_test') {
  throw new Error('TEST_DATABASE_URL must target a dedicated test database with ?schema=bav_test');
}

const config = loadConfig({
  NODE_ENV: 'test',
  DATABASE_URL: url,
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: randomBytes(32).toString('hex'),
});
const db = createDatabase(url);
const { app, auth } = createApp(config, db);
const client = request(app);
const marker = randomUUID();
const student = {
  email: `student-${marker}@example.org`,
  displayName: 'Integration Student',
  password: randomBytes(18).toString('hex'),
};
const admin = {
  ...student,
  email: `admin-${marker}@example.org`,
  displayName: 'Integration Admin',
};
let categoryId: string;

async function login(account: typeof student) {
  const result = await client
    .post('/api/v1/auth/login')
    .set('Origin', config.FRONTEND_URL)
    .send({ email: account.email, password: account.password })
    .expect(200);
  const cookies = result.get('Set-Cookie') ?? [];
  expect(cookies[0]).toMatch(/HttpOnly; SameSite=Lax/i);
  expect(result.body.data).not.toHaveProperty('passwordHash');
  expect(result.body.data).not.toHaveProperty('sessionVersion');
  return cookies[0].split(';')[0];
}

beforeAll(async () => {
  await db.$connect();
  await db.role.findUniqueOrThrow({ where: { name: 'USER' } });
  await client.post('/api/v1/auth/register').send(student).expect(201);
  await client.post('/api/v1/auth/register').send(admin).expect(201);
  await db.user.update({
    where: { email: admin.email },
    data: { role: { connect: { name: 'ADMIN' } } },
  });
  const category = await db.category.create({
    data: { name: 'Integration category', slug: marker },
  });
  categoryId = category.id;
}, 20_000);

afterAll(async () => {
  try {
    await db.$transaction([
      db.auditLog.deleteMany({ where: { actor: { email: admin.email } } }),
      db.post.deleteMany({ where: { category: { slug: marker } } }),
      db.category.deleteMany({ where: { slug: marker } }),
      db.user.deleteMany({ where: { email: { in: [student.email, admin.email] } } }),
    ]);
  } finally {
    await db.$disconnect();
  }
}, 20_000);

describe('API on PostgreSQL', () => {
  it('serves health, validates input and rejects cross-origin writes', async () => {
    const health = await client.get('/api/v1/health').expect(200);
    expect(health.body).toMatchObject({ success: true, data: { status: 'ok' } });
    expect(health.headers['x-content-type-options']).toBe('nosniff');
    await client.post('/api/v1/auth/register').send({ email: 'invalid' }).expect(422);
    await client
      .post('/api/v1/auth/login')
      .set('Origin', 'https://untrusted.example')
      .send(student)
      .expect(403);
    await client.get('/api/v1/unknown').expect(404);
    await client.get('/api/v1/admin/users').expect(401);
  });

  it('hashes passwords, protects profile and invalidates tokens on logout', async () => {
    const stored = await db.user.findUniqueOrThrow({ where: { email: student.email } });
    expect(stored.passwordHash).not.toBe(student.password);
    await client.post('/api/v1/auth/register').send(student).expect(409);
    await client
      .post('/api/v1/auth/login')
      .send({ email: student.email, password: 'wrong-password' })
      .expect(401);
    const cookie = await login(student);
    const profile = await client.get('/api/v1/users/profile').set('Cookie', cookie).expect(200);
    expect(profile.body.data).toMatchObject({ email: student.email, role: { name: 'USER' } });
    await client.get('/api/v1/admin/users').set('Cookie', cookie).expect(403);
    await client.post('/api/v1/auth/logout').set('Cookie', cookie).expect(200);
    await client.get('/api/v1/users/profile').set('Cookie', cookie).expect(401);
  }, 15_000);

  it('rejects inactive or blocked accounts, including an already-issued token', async () => {
    const cookie = await login(student);
    try {
      await db.user.update({ where: { email: student.email }, data: { status: 'BLOCKED' } });
      await client.get('/api/v1/users/profile').set('Cookie', cookie).expect(403);
      await client
        .post('/api/v1/auth/login')
        .send({ email: student.email, password: student.password })
        .expect(403);
      await db.user.update({ where: { email: student.email }, data: { status: 'INACTIVE' } });
      await client.get('/api/v1/users/profile').set('Cookie', cookie).expect(403);
    } finally {
      await db.user.update({ where: { email: student.email }, data: { status: 'ACTIVE' } });
    }
  }, 15_000);

  it('lists only approved listings publicly and records a single audit entry under concurrent review', async () => {
    const studentCookie = await login(student);
    const adminCookie = await login(admin);
    const input = {
      title: `Giáo trình ${marker}`,
      description: 'Kiểm thử bài đăng Marketplace',
      price: 15000,
      categoryId,
    };
    await client.get('/api/v1/admin/users').set('Cookie', adminCookie).expect(200);
    const result = await client
      .post('/api/v1/posts')
      .set('Cookie', studentCookie)
      .send(input)
      .expect(201);
    const postId = String(result.body.data.id);
    expect(result.body.data.status).toBe('PENDING');
    await client.get(`/api/v1/posts/${postId}`).expect(404);
    const own = await client.get('/api/v1/posts/mine').set('Cookie', studentCookie).expect(200);
    expect(own.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: postId })]),
    );
    const awaiting = await client
      .get('/api/v1/admin/posts/pending')
      .set('Cookie', adminCookie)
      .expect(200);
    expect(awaiting.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: postId })]),
    );

    const approve = `/api/v1/admin/posts/${postId}/approve`;
    await client.patch(approve).set('Cookie', studentCookie).expect(403);
    const outcomes = await Promise.all([
      client.patch(approve).set('Cookie', adminCookie),
      client.patch(approve).set('Cookie', adminCookie),
    ]);
    expect(outcomes.map(({ status }) => status).sort()).toEqual([200, 409]);
    const published = await client
      .get('/api/v1/posts')
      .query({ q: marker, category: marker })
      .expect(200);
    expect(published.body.data).toMatchObject([{ id: postId, status: 'APPROVED', price: 15000 }]);
    await client.get(`/api/v1/posts/${postId}`).expect(200);
    expect(await db.auditLog.count({ where: { entityId: postId, action: 'POST_APPROVED' } })).toBe(
      1,
    );

    const other = await client
      .post('/api/v1/posts')
      .set('Cookie', studentCookie)
      .send(input)
      .expect(201);
    const rejected = String(other.body.data.id);
    await client
      .patch(`/api/v1/admin/posts/${rejected}/reject`)
      .set('Cookie', adminCookie)
      .expect(200);
    await client.get(`/api/v1/posts/${rejected}`).expect(404);
  }, 20_000);

  it('authenticates Socket.IO and rechecks revoked sessions', async () => {
    const cookie = await login(student);
    const server = createServer(app);
    const sockets = attachSockets(server, config.FRONTEND_URL, auth);
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const options = {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      autoConnect: false,
    };
    const guest = connectSocket(address, options);
    const member = connectSocket(address, {
      ...options,
      extraHeaders: { Cookie: cookie, Origin: config.FRONTEND_URL },
    });

    function open(socket: Socket) {
      return new Promise<void>((resolve, reject) => {
        socket.once('connect', resolve);
        socket.once('connect_error', reject);
        socket.connect();
      });
    }

    try {
      await expect(open(guest)).rejects.toThrow('Authentication required');
      await open(member);
      await expect(member.timeout(2000).emitWithAck('session:check')).resolves.toEqual({
        authenticated: true,
      });
      await client.post('/api/v1/auth/logout').set('Cookie', cookie).expect(200);
      await expect(member.timeout(2000).emitWithAck('session:check')).resolves.toEqual({
        authenticated: false,
      });
    } finally {
      guest.disconnect();
      member.disconnect();
      await sockets.close();
    }
  }, 15_000);
});
