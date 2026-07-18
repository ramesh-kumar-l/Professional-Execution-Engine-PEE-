import { MobileAuthSession, resolveApiBaseUrl } from '../auth/mobile-auth-session';
import { MobileStore } from '../db/mobile-store';
import { MobileSyncClient } from '../db/mobile-sync-client';
import { SyncStatus } from './sync-types';

const BACKGROUND_SYNC_INTERVAL_MS = 30_000;

/**
 * Manual "sync now" plus a bounded background interval doing the same round — the mobile
 * equivalent of apps/desktop/electron/main/ipc/sync-ipc.ts, minus the IPC/window plumbing (there
 * is no separate process here to notify; listeners subscribe directly).
 */
export class BackgroundSyncRunner {
  private readonly client: MobileSyncClient;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;
  private listeners: Array<(status: SyncStatus) => void> = [];

  constructor(store: MobileStore, private readonly authSession: MobileAuthSession) {
    this.client = new MobileSyncClient(store, {
      baseUrl: resolveApiBaseUrl(),
      getAccessToken: () => authSession.peekAccessToken(),
    });
  }

  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((candidate) => candidate !== listener);
    };
  }

  start(): void {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      this.runSync().catch(() => undefined);
    }, BACKGROUND_SYNC_INTERVAL_MS);
  }

  stop(): void {
    if (this.intervalHandle) clearInterval(this.intervalHandle);
    this.intervalHandle = null;
  }

  private emit(status: SyncStatus): void {
    this.listeners.forEach((listener) => listener(status));
  }

  private async withRefreshRetry<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      const refreshed = await this.authSession.refreshNow();
      if (!refreshed) throw err;
      return fn();
    }
  }

  async runSync(): Promise<SyncStatus> {
    if (!this.authSession.getUser()) return { phase: 'idle' };
    this.emit({ phase: 'syncing' });
    try {
      const pulled = await this.withRefreshRetry(() => this.client.pullUntilCaughtUp());
      const pushResponse = await this.withRefreshRetry(() => this.client.push());
      const pushed = pushResponse.results.filter((result) => result.status === 'applied').length;
      const status: SyncStatus = { phase: 'synced', at: new Date().toISOString(), pulled, pushed };
      this.emit(status);
      return status;
    } catch (err) {
      const status: SyncStatus = { phase: 'error', message: err instanceof Error ? err.message : 'Sync failed' };
      this.emit(status);
      return status;
    }
  }
}
