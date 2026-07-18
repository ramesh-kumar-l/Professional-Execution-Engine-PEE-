import { SyncPushChange, SyncPushResponse, SyncPullResponse } from '@pee/types';
import { MobileStore } from './mobile-store';
import { PendingOutboxEntry } from './types';

export interface MobileSyncClientOptions {
  baseUrl: string;
  getAccessToken: () => string;
  fetchImpl?: typeof fetch;
}

const CURSOR_KEY = 'all';

/**
 * A line-for-line port of packages/local-client/src/sync-client.ts's pull/push algorithm — same
 * cursor bookkeeping, same outbox-collapsing, same last-write-wins conflict handling — reading
 * from MobileStore instead of a Prisma-backed LocalStore. Talks to the exact same POST /sync/pull
 * and POST /sync/push contract on services/sync; zero backend changes. See adr/0008.
 */
export class MobileSyncClient {
  constructor(
    private readonly store: MobileStore,
    private readonly options: MobileSyncClientOptions,
  ) {}

  async pull(): Promise<{ pulled: number; hasMore: boolean }> {
    const since = await this.store.getCursor(CURSOR_KEY);
    const response = await this.request<SyncPullResponse>('/sync/pull', { since });
    for (const change of response.changes) {
      await this.store.applyServerChange(change);
    }
    await this.store.setCursor(CURSOR_KEY, response.cursor);
    return { pulled: response.changes.length, hasMore: response.hasMore };
  }

  async pullUntilCaughtUp(maxRounds = 20): Promise<number> {
    let total = 0;
    for (let round = 0; round < maxRounds; round += 1) {
      const { pulled, hasMore } = await this.pull();
      total += pulled;
      if (!hasMore) break;
    }
    return total;
  }

  async push(): Promise<SyncPushResponse> {
    const pending = await this.store.listPendingOutbox();
    if (pending.length === 0) {
      return { results: [] };
    }

    const groups = this.groupByRecord(pending);
    const changes: SyncPushChange[] = [];
    for (const group of groups) {
      const change = await this.buildPushChange(group[0]);
      if (change) changes.push(change);
    }

    const response = await this.request<SyncPushResponse>('/sync/push', { changes });

    await Promise.all(
      response.results.map(async (result, index) => {
        const group = groups[index];
        if (!group) return;
        if (result.status === 'conflict' && result.serverRecord) {
          await this.store.applyServerChange(result.serverRecord);
        }
        if (result.status !== 'rejected') {
          await Promise.all(group.map((entry) => this.store.markOutboxPushed(entry.id)));
        }
      }),
    );

    return response;
  }

  private groupByRecord(entries: PendingOutboxEntry[]): PendingOutboxEntry[][] {
    const byKey = new Map<string, PendingOutboxEntry[]>();
    for (const entry of entries) {
      const key = `${entry.entity}:${entry.recordId}`;
      const group = byKey.get(key) ?? [];
      group.push(entry);
      byKey.set(key, group);
    }
    return [...byKey.values()];
  }

  private async buildPushChange(entry: PendingOutboxEntry): Promise<SyncPushChange | null> {
    if (entry.entity === 'project') {
      const row = await this.store.projects.getById(entry.recordId);
      if (!row) return null;
      return {
        entity: 'project',
        id: row.id,
        data: { name: row.name, description: row.description, status: row.status },
        clientUpdatedAt: row.updatedAt,
        clientVersion: row.version,
      };
    }
    if (entry.entity === 'goal') {
      const row = await this.store.goals.getById(entry.recordId);
      if (!row) return null;
      return {
        entity: 'goal',
        id: row.id,
        data: { projectId: row.projectId, title: row.title, description: row.description, targetDate: row.targetDate, status: row.status },
        clientUpdatedAt: row.updatedAt,
        clientVersion: row.version,
      };
    }
    if (entry.entity === 'task') {
      const row = await this.store.tasks.getById(entry.recordId);
      if (!row) return null;
      return {
        entity: 'task',
        id: row.id,
        data: { goalId: row.goalId, title: row.title, description: row.description, order: row.order, status: row.status },
        clientUpdatedAt: row.updatedAt,
        clientVersion: row.version,
      };
    }
    return null;
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const fetchImpl = this.options.fetchImpl ?? fetch;
    const res = await fetchImpl(`${this.options.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.options.getAccessToken()}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Sync request to ${path} failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  }
}
