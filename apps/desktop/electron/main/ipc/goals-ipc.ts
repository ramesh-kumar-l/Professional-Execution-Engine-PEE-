import { ipcMain } from 'electron';
import type { LocalGoalFields, LocalStore } from '@pee/local-client';
import { AuthSession } from '../auth/auth-session';
import { requireOwnerId } from '../auth/require-owner';
import { IPC_CHANNELS } from './ipc-channels';

export function registerGoalsIpc(store: LocalStore, authSession: AuthSession): void {
  ipcMain.handle(IPC_CHANNELS.goalsList, (_event, projectId: string) => {
    const ownerId = requireOwnerId(authSession);
    return store.db.localGoal.findMany({ where: { ownerId, projectId }, orderBy: { updatedAt: 'desc' } });
  });

  ipcMain.handle(IPC_CHANNELS.goalsCreate, (_event, fields: LocalGoalFields) => {
    const ownerId = requireOwnerId(authSession);
    return store.createGoal(ownerId, fields);
  });

  ipcMain.handle(IPC_CHANNELS.goalsUpdate, (_event, id: string, fields: Partial<LocalGoalFields>) => {
    requireOwnerId(authSession);
    return store.updateGoal(id, fields);
  });
}
