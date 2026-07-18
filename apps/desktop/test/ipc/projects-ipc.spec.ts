import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../electron/main/ipc/ipc-channels';
import { registerProjectsIpc } from '../../electron/main/ipc/projects-ipc';

type Handler = (...args: unknown[]) => unknown;
const handlers = new Map<string, Handler>();

vi.mock('electron', () => ({
  ipcMain: {
    handle: (channel: string, listener: Handler) => handlers.set(channel, listener),
  },
}));

function fakeAuthSession(userId: string | null) {
  return { getUser: () => (userId ? { id: userId, email: 'a@a.com', displayName: 'A', role: 'USER' as const } : null) };
}

describe('registerProjectsIpc', () => {
  it('lists projects scoped to the current owner', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'p1' }]);
    const store = { db: { localProject: { findMany } } };
    registerProjectsIpc(store as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.projectsList)!({});

    expect(findMany).toHaveBeenCalledWith({ where: { ownerId: 'user-1' }, orderBy: { updatedAt: 'desc' } });
    expect(result).toEqual([{ id: 'p1' }]);
  });

  it('throws when not authenticated', () => {
    const store = { db: { localProject: { findMany: vi.fn() } } };
    registerProjectsIpc(store as never, fakeAuthSession(null) as never);

    expect(() => handlers.get(IPC_CHANNELS.projectsList)!({})).toThrow('Not authenticated');
  });

  it('creates a project for the current owner', async () => {
    const createProject = vi.fn().mockResolvedValue({ id: 'p1', name: 'New' });
    registerProjectsIpc({ createProject } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.projectsCreate)!({}, { name: 'New' });

    expect(createProject).toHaveBeenCalledWith('user-1', { name: 'New' });
    expect(result).toEqual({ id: 'p1', name: 'New' });
  });

  it('updates a project', async () => {
    const updateProject = vi.fn().mockResolvedValue({ id: 'p1', name: 'Renamed' });
    registerProjectsIpc({ updateProject } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.projectsUpdate)!({}, 'p1', { name: 'Renamed' });

    expect(updateProject).toHaveBeenCalledWith('p1', { name: 'Renamed' });
    expect(result).toEqual({ id: 'p1', name: 'Renamed' });
  });
});
