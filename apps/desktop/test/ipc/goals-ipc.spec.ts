import { describe, expect, it, vi } from 'vitest';
import { registerGoalsIpc } from '../../electron/main/ipc/goals-ipc';
import { IPC_CHANNELS } from '../../electron/main/ipc/ipc-channels';

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

describe('registerGoalsIpc', () => {
  it('lists goals scoped to the current owner and project', async () => {
    const findMany = vi.fn().mockResolvedValue([{ id: 'g1' }]);
    registerGoalsIpc({ db: { localGoal: { findMany } } } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.goalsList)!({}, 'project-1');

    expect(findMany).toHaveBeenCalledWith({ where: { ownerId: 'user-1', projectId: 'project-1' }, orderBy: { updatedAt: 'desc' } });
    expect(result).toEqual([{ id: 'g1' }]);
  });

  it('throws when not authenticated', () => {
    registerGoalsIpc({ db: { localGoal: { findMany: vi.fn() } } } as never, fakeAuthSession(null) as never);

    expect(() => handlers.get(IPC_CHANNELS.goalsList)!({}, 'project-1')).toThrow('Not authenticated');
  });

  it('creates a goal for the current owner', async () => {
    const createGoal = vi.fn().mockResolvedValue({ id: 'g1', title: 'New goal' });
    registerGoalsIpc({ createGoal } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.goalsCreate)!({}, { projectId: 'project-1', title: 'New goal' });

    expect(createGoal).toHaveBeenCalledWith('user-1', { projectId: 'project-1', title: 'New goal' });
    expect(result).toEqual({ id: 'g1', title: 'New goal' });
  });

  it('updates a goal', async () => {
    const updateGoal = vi.fn().mockResolvedValue({ id: 'g1', title: 'Renamed' });
    registerGoalsIpc({ updateGoal } as never, fakeAuthSession('user-1') as never);

    const result = await handlers.get(IPC_CHANNELS.goalsUpdate)!({}, 'g1', { title: 'Renamed' });

    expect(updateGoal).toHaveBeenCalledWith('g1', { title: 'Renamed' });
    expect(result).toEqual({ id: 'g1', title: 'Renamed' });
  });
});
