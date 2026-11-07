import { randomBytes, randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config/env';
import { TOKEN_AUDIENCE, TOKEN_ISSUER } from '../../src/constants/auth';
import { signAccessToken, verifyAccessToken } from '../../src/utils/tokens';
import { registerBody } from '../../src/validators/auth';
import { postQuery } from '../../src/validators/marketplace';

const secret = randomBytes(32).toString('hex');

describe('configuration', () => {
  it('reports missing credentials by name without revealing their values', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL.*JWT_ACCESS_SECRET/);
  });

  it('requires HTTPS for the production web origin', () => {
    expect(() =>
      loadConfig({
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/bav',
        JWT_ACCESS_SECRET: secret,
        FRONTEND_URL: 'http://localhost:3000',
      }),
    ).toThrow(/Production requires HTTPS/);
  });
});

describe('JWT verification', () => {
  it('accepts a signed access token with the expected subject and session version', () => {
    const id = randomUUID();
    expect(verifyAccessToken(signAccessToken(id, 3, secret), secret)).toMatchObject({
      sub: id,
      version: 3,
    });
  });

  it('rejects a token signed with another key', () => {
    const token = signAccessToken(randomUUID(), 0, secret);
    expect(() => verifyAccessToken(token, randomBytes(32).toString('hex'))).toThrow(/invalid/i);
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ version: 0 }, secret, {
      algorithm: 'HS256',
      subject: randomUUID(),
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
      expiresIn: -1,
    });
    expect(() => verifyAccessToken(token, secret)).toThrow(/expired/i);
  });
});

describe('input validation', () => {
  it('normalizes email and rejects an injected role', () => {
    const input = {
      email: ' Student@Example.org ',
      displayName: ' Sinh viên ',
      password: 'passphrase',
    };
    expect(registerBody.parse(input).email).toBe('student@example.org');
    expect(registerBody.safeParse({ ...input, role: 'ADMIN' }).success).toBe(false);
  });

  it('rejects long UTF-8 passwords before bcrypt can truncate them', () => {
    expect(
      registerBody.safeParse({
        email: 'a@example.org',
        displayName: 'BAV',
        password: 'ệ'.repeat(25),
      }).success,
    ).toBe(false);
  });

  it('bounds pagination', () => {
    expect(postQuery.parse({ page: '2' })).toMatchObject({ page: 2, limit: 20 });
    expect(postQuery.safeParse({ limit: '51' }).success).toBe(false);
  });
});
