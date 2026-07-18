import type { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';
import { LocalStore, SyncClient } from '@pee/local-client';
import { AuthSession } from '../auth/auth-session';
import { IPC_CHANNELS, SyncStatus } from './ipc-channels';

const BACKGROUND_SYNC_INTERVAL_MS = 30_000;
const API_BASE_URL = process.env.PEE_API_URL ?? 'http://localhost:3001';

/** Manual "sync now" IPC handler plus a bounded background interval doing the same round —
 *  both drive the same @pee/local-client SyncClient built here, unmodified from Phase 5. */
export function registerSyncIpc(store: LocalStore, authSession: AuthSession, window: BrowserWindow): { stop: () => void } {
  const client = new SyncClient(store, {
    baseUrl: API_BASE_URL,
    getAccessToken: () => authSession.peekAccessToken(),
  });

  function emitStatus(status: SyncStatus): void {
    if (!window.isDestroyed()) window.webContents.send(IPC_CHANNELS.syncStatusEvent, status);
  }

  async function withRefreshRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const refreshed = await authSession.refreshNow();
      if (!refreshed) throw err;
      return fn();
    }
  }

  async function runSync(): Promise<SyncStatus> {
    if (!authSession.getUser()) return { phase: 'idle' };
    emitStatus({ phase: 'syncing' });
    try {
      const pulled = await withRefreshRetry(() => client.pullUntilCaughtUp());
      const pushResponse = await withRefreshRetry(() => client.push());
      const pushed = pushResponse.results.filter((result) => result.status === 'applied').length;
      const status: SyncStatus = { phase: 'synced', at: new Date().toISOString(), pulled, pushed };
      emitStatus(status);
      return status;
    } catch (err) {
      const status: SyncStatus = { phase: 'error', message: err instanceof Error ? err.message : 'Sync failed' };
      emitStatus(status);
      return status;
    }
  }

  ipcMain.handle(IPC_CHANNELS.syncNow, () => runSync());

  const interval = setInterval(() => {
    runSync().catch(() => undefined);
  }, BACKGROUND_SYNC_INTERVAL_MS);

  return { stop: () => clearInterval(interval) };
}
