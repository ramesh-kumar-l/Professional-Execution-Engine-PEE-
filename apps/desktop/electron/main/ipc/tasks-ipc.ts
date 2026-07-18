import { ipcMain } from 'electron';
import type { LocalStore, LocalTaskFields } from '@pee/local-client';
import { AuthSession } from '../auth/auth-session';
import { requireOwnerId } from '../auth/require-owner';
import { IPC_CHANNELS } from './ipc-channels';

export function registerTasksIpc(store: LocalStore, authSession: AuthSession): void {
  ipcMain.handle(IPC_CHANNELS.tasksList, (_event, goalId: string) => {
    const ownerId = requireOwnerId(authSession);
    return store.db.localTask.findMany({ where: { ownerId, goalId }, orderBy: { order: 'asc' } });
  });

  ipcMain.handle(IPC_CHANNELS.tasksCreate, (_event, fields: LocalTaskFields) => {
    const ownerId = requireOwnerId(authSession);
    return store.createTask(ownerId, fields);
  });

  ipcMain.handle(IPC_CHANNELS.tasksUpdate, (_event, id: string, fields: Partial<LocalTaskFields>) => {
    requireOwnerId(authSession);
    return store.updateTask(id, fields);
  });
}
