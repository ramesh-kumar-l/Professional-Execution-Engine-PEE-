jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
  };
});

import { MobileAuthSession } from '../../src/auth/mobile-auth-session';

function jsonResponse(body: unknown, ok = true, status = ok ? 200 : 401): Response {
  return { ok, status, json: async () => body } as Response;
}

describe('MobileAuthSession', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('logs in, stores the refresh token, and exposes the user', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ user: { id: 'u1', displayName: 'Ada' }, tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' } }),
    );
    const session = new MobileAuthSession();

    const result = await session.login('ada@example.com', 'pw');

    expect('error' in result).toBe(false);
    expect(session.getUser()).toEqual({ id: 'u1', displayName: 'Ada' });
    expect(session.peekAccessToken()).toBe('access-1');
  });

  it('returns a clean error on invalid credentials without touching secure storage', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}, false, 401));
    const session = new MobileAuthSession();

    const result = await session.login('ada@example.com', 'wrong');

    expect(result).toEqual({ error: 'Invalid email or password.' });
    expect(session.getUser()).toBeNull();
  });

  it('throws from peekAccessToken before any login', () => {
    const session = new MobileAuthSession();
    expect(() => session.peekAccessToken()).toThrow('Not authenticated');
  });

  it('authedFetch retries once with a refreshed token after a 401', async () => {
    const session = new MobileAuthSession();
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      jsonResponse({ user: { id: 'u1' }, tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' } }),
    );
    await session.login('ada@example.com', 'pw');

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(jsonResponse({}, false, 401))
      .mockResolvedValueOnce(jsonResponse({ accessToken: 'access-2', refreshToken: 'refresh-2' }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const res = await session.authedFetch('/projects');

    expect(await res.json()).toEqual({ ok: true });
    expect(session.peekAccessToken()).toBe('access-2');
    expect(global.fetch).toHaveBeenCalledTimes(4);
  });

  it('logout clears the in-memory session and the stored refresh token', async () => {
    const session = new MobileAuthSession();
    (global.fetch as jest.Mock).mockResolvedValue(
      jsonResponse({ user: { id: 'u1' }, tokens: { accessToken: 'access-1', refreshToken: 'refresh-1' } }),
    );
    await session.login('ada@example.com', 'pw');

    (global.fetch as jest.Mock).mockResolvedValue(jsonResponse({}));
    await session.logout();

    expect(session.getUser()).toBeNull();
    expect(() => session.peekAccessToken()).toThrow('Not authenticated');
  });
});
