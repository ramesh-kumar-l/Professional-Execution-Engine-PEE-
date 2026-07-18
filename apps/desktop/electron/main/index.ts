import path from 'path';
import { app, BrowserWindow } from 'electron';
import { AuthSession } from './auth/auth-session';
import { registerAuthIpc } from './auth/auth-ipc';
import { registerGoalsIpc } from './ipc/goals-ipc';
import { registerProjectsIpc } from './ipc/projects-ipc';
import { registerRemoteIpc } from './ipc/remote-ipc';
import { registerSyncIpc } from './ipc/sync-ipc';
import { registerTasksIpc } from './ipc/tasks-ipc';
import { closeLocalStore, getLocalStore } from './store/local-store-factory';

// Without this, an unpackaged dev/test run resolves userData to Electron's generic default
// folder, colliding with every other Electron app run unpackaged on the same machine.
app.setName('pee-desktop');

const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  let mainWindow: BrowserWindow | null = null;
  let stopSync: (() => void) | undefined;

  function createWindow(): void {
    mainWindow = new BrowserWindow({
      width: 1100,
      height: 760,
      webPreferences: {
        preload: path.join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });

    if (process.env.ELECTRON_RENDERER_URL) {
      mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
    } else {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    const store = getLocalStore();
    const authSession = new AuthSession();
    await authSession.restore();

    registerAuthIpc(authSession);
    registerProjectsIpc(store, authSession);
    registerGoalsIpc(store, authSession);
    registerTasksIpc(store, authSession);
    registerRemoteIpc(authSession);

    createWindow();
    if (mainWindow) {
      stopSync = registerSyncIpc(store, authSession, mainWindow).stop;
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => {
    stopSync?.();
  });

  app.on('will-quit', () => {
    closeLocalStore().catch(() => undefined);
  });
}
