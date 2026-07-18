import { describe, expect, it, vi } from 'vitest';
import { registerAuthIpc } from '../../electron/main/auth/auth-ipc';
import { IPC_CHANNELS } from '../../electron/main/ipc/ipc-channels';

type Handler = (...args: unknown[]) => unknown;
const handlers = new Map<string, Handler>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, listener: Handler) => handlers.set(channel, listener),
  },
}));

describe('registerAuthIpc', () => {
  it('returns null when there is no active session', async () => {
    registerAuthIpc({ getUser: () => null, login: vi.fn(), logout: vi.fn() } as never);

    const result = await handlers.get(IPC_CHANNELS.authGetSession)!();
    expect(result).toBeNull();
  });

  it('wraps the current user when logged in', async () => {
    const user = { id: 'u1' };
    registerAuthIpc({ getUser: () => user, login: vi.fn(), logout: vi.fn() } as never);

    const result = await handlers.get(IPC_CHANNELS.authGetSession)!();
    expect(result).toEqual({ user });
  });

  it('delegates login to AuthSession', async () => {
    const login = vi.fn().mockResolvedValue({ user: { id: 'u1' } });
    registerAuthIpc({ getUser: () => null, login, logout: vi.fn() } as never);

    await handlers.get(IPC_CHANNELS.authLogin)!({}, 'a@a.com', 'pw');

    expect(login).toHaveBeenCalledWith('a@a.com', 'pw');
  });

  it('delegates logout to AuthSession', async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    registerAuthIpc({ getUser: () => null, login: vi.fn(), logout } as never);

    await handlers.get(IPC_CHANNELS.authLogout)!({});

    expect(logout).toHaveBeenCalled();
  });
});
