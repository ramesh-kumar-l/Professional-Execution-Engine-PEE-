import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../ipc/ipc-channels';
import { AuthSession } from './auth-session';

export function registerAuthIpc(authSession: AuthSession): void {
  ipcMain.handle(IPC_CHANNELS.authLogin, (_event, email: string, password: string) => authSession.login(email, password));

  ipcMain.handle(IPC_CHANNELS.authLogout, () => authSession.logout());

  ipcMain.handle(IPC_CHANNELS.authGetSession, () => {
    const user = authSession.getUser();
    return user ? { user } : null;
  });
}
