import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginSchema, registerSchema } from '@/features/auth/schema';
import { api, apiUrl } from '@/lib/api';

afterEach(() => vi.unstubAllGlobals());

describe('API client', () => {
  it('joins URL segments and rejects an invalid API origin', () => {
    expect(apiUrl('/health', 'https://api.example.org/api/v1/')).toBe(
      'https://api.example.org/api/v1/health',
    );
    expect(() => apiUrl('/health', 'file:///api/v1')).toThrow();
  });

  it('includes cookies and returns the success payload', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(Response.json({ success: true, message: 'OK', data: { id: 'example' } }));
    vi.stubGlobal('fetch', fetcher);
    await expect(api('/auth/login', { method: 'POST', body: '{}' })).resolves.toEqual({
      id: 'example',
    });
    expect(fetcher).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        credentials: 'include',
        headers: expect.any(Headers),
      }),
    );
    expect(fetcher.mock.calls[0][1].headers.get('Content-Type')).toBe('application/json');
  });

  it('preserves the API failure status for UI handling', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { success: false, message: 'Authentication required', errors: [] },
            { status: 401 },
          ),
        ),
    );
    await expect(api('/users/profile')).rejects.toMatchObject({
      status: 401,
      message: 'Authentication required',
    });
  });
});

describe('auth form schemas', () => {
  it('normalizes email and only requires a display name on registration', () => {
    const input = { email: ' Student@Example.org ', password: 'passphrase', displayName: '' };
    expect(loginSchema.parse(input).email).toBe('student@example.org');
    expect(registerSchema.safeParse(input).success).toBe(false);
    expect(registerSchema.safeParse({ ...input, displayName: 'Sinh viên' }).success).toBe(true);
  });
});
