import { existsSync, mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthSession } from '../../electron/main/auth/auth-session';

let userDataDir: string;

vi.mock('electron', () => ({
  app: { getPath: () => userDataDir },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (value: string) => Buffer.from(value, 'utf8'),
    decryptString: (buffer: Buffer) => buffer.toString('utf8'),
  },
}));

const sampleUser = { id: 'u1', email: 'a@a.com', displayName: 'A', role: 'USER' as const };
const sampleTokens = { accessToken: 'access-1', refreshToken: 'refresh-1', accessTokenExpiresAt: '', refreshTokenExpiresAt: '' };

function tokenFile(): string {
  return path.join(userDataDir, 'refresh-token.enc');
}

describe('AuthSession', () => {
  beforeEach(() => {
    userDataDir = mkdtempSync(path.join(tmpdir(), 'pee-desktop-auth-'));
  });

  afterEach(() => {
    if (existsSync(userDataDir)) rmSync(userDataDir, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });

  it('logs in and persists the refresh token to disk', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: sampleUser, tokens: sampleTokens }) }));

    const session = new AuthSession();
    const result = await session.login('a@a.com', 'password');

    expect(result).toEqual({ user: sampleUser });
    expect(session.getUser()).toEqual(sampleUser);
    expect(existsSync(tokenFile())).toBe(true);
  });

  it('returns an error on invalid credentials', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const session = new AuthSession();
    const result = await session.login('a@a.com', 'wrong');

    expect(result).toEqual({ error: 'Invalid email or password.' });
  });

  it('clears the stored refresh token on logout', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true, json: async () => ({ user: sampleUser, tokens: sampleTokens }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) }),
    );

    const session = new AuthSession();
    await session.login('a@a.com', 'password');
    await session.logout();

    expect(session.getUser()).toBeNull();
    expect(existsSync(tokenFile())).toBe(false);
  });

  it('retries an authed request once after a 401 by refreshing the access token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ user: sampleUser, tokens: sampleTokens }) })
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ accessToken: 'fresh', refreshToken: 'refresh-2', accessTokenExpiresAt: '', refreshTokenExpiresAt: '' }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) });
    vi.stubGlobal('fetch', fetchMock);

    const session = new AuthSession();
    await session.login('a@a.com', 'password');
    const res = await session.authedFetch('/analytics/summary');

    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
