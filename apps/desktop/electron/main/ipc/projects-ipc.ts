import { ipcMain } from 'electron';
import type { LocalProjectFields, LocalStore } from '@pee/local-client';
import { AuthSession } from '../auth/auth-session';
import { requireOwnerId } from '../auth/require-owner';
import { IPC_CHANNELS } from './ipc-channels';

export function registerProjectsIpc(store: LocalStore, authSession: AuthSession): void {
  ipcMain.handle(IPC_CHANNELS.projectsList, () => {
    const ownerId = requireOwnerId(authSession);
    return store.db.localProject.findMany({ where: { ownerId }, orderBy: { updatedAt: 'desc' } });
  });

  ipcMain.handle(IPC_CHANNELS.projectsCreate, (_event, fields: LocalProjectFields) => {
    const ownerId = requireOwnerId(authSession);
    return store.createProject(ownerId, fields);
  });

  ipcMain.handle(IPC_CHANNELS.projectsUpdate, (_event, id: string, fields: Partial<LocalProjectFields>) => {
    requireOwnerId(authSession);
    return store.updateProject(id, fields);
  });
}
