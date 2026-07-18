import { describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../electron/main/ipc/ipc-channels';
import { registerTasksIpc } from '../../electron/main/ipc/tasks-ipc';

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

describe('registerTasksIpc', () => {
  it('lists tasks scoped to the current owner and goal, ordered by position', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 't1' }]);
    registerTasksIpc({ db: { localTask: { findMany } } } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.tasksList)!({}, 'goal-1');

    expect(findMany).toHaveBeenCalledWith({ where: { ownerId: 'user-1', goalId: 'goal-1' }, orderBy: { order: 'asc' } });
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('throws when not authenticated', () => {
    registerTasksIpc({ db: { localTask: { findMany: vi.fn() } } } as never, fakeAuthSession(null) as never);

    expect(() => handlers.get(IPC_CHANNELS.tasksList)!({}, 'goal-1')).toThrow('Not authenticated');
  });

  it('creates a task for the current owner', async () => {
    const createTask = vi.fn().mockResolvedValue({ id: 't1', title: 'New task' });
    registerTasksIpc({ createTask } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.tasksCreate)!({}, { goalId: 'goal-1', title: 'New task' });

    expect(createTask).toHaveBeenCalledWith('user-1', { goalId: 'goal-1', title: 'New task' });
    expect(result).toEqual({ id: 't1', title: 'New task' });
  });

  it('updates a task', async () => {
    const updateTask = vi.fn().mockResolvedValue({ id: 't1', status: 'DONE' });
    registerTasksIpc({ updateTask } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.tasksUpdate)!({}, 't1', { status: 'DONE' });

    expect(updateTask).toHaveBeenCalledWith('t1', { status: 'DONE' });
    expect(result).toEqual({ id: 't1', status: 'DONE' });
  });
});
