import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../electron/main/ipc/ipc-channels';
import { registerSyncIpc } from '../../electron/main/ipc/sync-ipc';

type Handler = (...args: unknown[]) => unknown;
const handlers = new Map<string, Handler>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, listener: Handler) => handlers.set(channel, listener),
  },
}));

const pullUntilCaughtUp = vi.fn();
const push = vi.fn();

vi.mock('@pee/local-client', () => ({
  SyncClient: vi.fn().mockImplementation(() => ({ pullUntilCaughtUp, push })),
}));

function fakeWindow() {
  return {
    isDestroyed: () => false,
    webContents: { send: vi.fn() },
  };
}

function fakeAuthSession(authenticated: boolean) {
  return {
    getUser: () => (authenticated ? { id: 'u1' } : null),
    peekAccessToken: () => 'token',
    refreshNow: vi.fn().mockResolvedValue(false),
  };
}

describe('registerSyncIpc', () => {
  beforeEach(() => {
    pullUntilCaughtUp.mockReset();
    push.mockReset();
  });

  it('reports idle when not authenticated', async () => {
    const { stop } = registerSyncIpc({} as never, fakeAuthSession(false) as never, fakeWindow() as never);

    const result = await handlers.get(IPC_CHANNELS.syncNow)!();

    expect(result).toEqual({ phase: 'idle' });
    stop();
  });

  it('runs a sync round and reports pulled/pushed counts', async () => {
    pullUntilCaughtUp.mockResolvedValue(3);
    push.mockResolvedValue({ results: [{ status: 'applied' }, { status: 'rejected' }] });

    const { stop } = registerSyncIpc({} as never, fakeAuthSession(true) as never, fakeWindow() as never);
    const result = await handlers.get(IPC_CHANNELS.syncNow)!();

    expect(result).toMatchObject({ phase: 'synced', pulled: 3, pushed: 1 });
    stop();
  });

  it('reports an error phase when the sync round throws', async () => {
    pullUntilCaughtUp.mockRejectedValue(new Error('network down'));

    const { stop } = registerSyncIpc({} as never, fakeAuthSession(true) as never, fakeWindow() as never);
    const result = await handlers.get(IPC_CHANNELS.syncNow)!();

    expect(result).toEqual({ phase: 'error', message: 'network down' });
    stop();
  });
});
