import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../electron/main/ipc/ipc-channels';
import { registerRemoteIpc } from '../../electron/main/ipc/remote-ipc';

type Handler = (...args: unknown[]) => unknown;
const handlers = new Map<string, Handler>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, listener: Handler) => handlers.set(channel, listener),
  },
}));

function jsonResponse(ok: boolean, body: unknown) {
  return { ok, json: async () => body };
}

function fakeAuthSession(authedFetch: (...args: unknown[]) => Promise<unknown>) {
  return { authedFetch };
}

describe('registerRemoteIpc', () => {
  it('starts execution and returns the session on success', async () => {
    const authedFetch = vi.fn().mockResolvedValue(jsonResponse(true, { id: 's1' }));
    registerRemoteIpc(fakeAuthSession(authedFetch) as never);

    const result = await handlers.get(IPC_CHANNELS.executionStart)!({}, 'task-1');

    expect(authedFetch).toHaveBeenCalledWith('/tasks/task-1/execution/start', { method: 'POST' });
    expect(result).toEqual({ id: 's1' });
  });

  it('maps a failed execution start to an error payload', async () => {
    const authedFetch = vi.fn().mockResolvedValue(jsonResponse(false, { message: 'nope' }));
    registerRemoteIpc(fakeAuthSession(authedFetch) as never);

    const result = await handlers.get(IPC_CHANNELS.executionStart)!({}, 'task-1');

    expect(result).toEqual({ error: 'nope' });
  });

  it('finds the pending recommendation from a paginated list response', async () => {
    const authedFetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(true, { data: [{ status: 'DISMISSED' }, { status: 'PENDING', id: 'r1' }] }));
    registerRemoteIpc(fakeAuthSession(authedFetch) as never);

    const result = await handlers.get(IPC_CHANNELS.aiGetPendingSuggestion)!({}, 'goal-1');

    expect(result).toEqual({ status: 'PENDING', id: 'r1' });
  });

  it('falls back to an empty velocity response on a failed fetch', async () => {
    const authedFetch = vi.fn().mockResolvedValue(jsonResponse(false, {}));
    registerRemoteIpc(fakeAuthSession(authedFetch) as never);

    const result = await handlers.get(IPC_CHANNELS.analyticsGetVelocity)!({}, 14);

    expect(result).toEqual({ days: 14, points: [] });
  });
});
