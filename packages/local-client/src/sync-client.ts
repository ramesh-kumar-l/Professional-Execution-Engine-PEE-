import { SyncPushChange, SyncPushResponse, SyncPullResponse } from '@pee/types';
import { LocalStore, PendingOutboxEntry } from './local-store';

export interface SyncClientOptions {
  baseUrl: string;
  getAccessToken: () => string;
  fetchImpl?: typeof fetch;
}

const CURSOR_KEY = 'all';

/**
 * Talks to POST /sync/pull and /sync/push (services/sync) on behalf of one LocalStore. Pulling
 * writes straight into the local tables via `applyServerChange`; pushing reads the outbox,
 * collapses repeat edits to the same row into one change, and reconciles the result.
 */
export class SyncClient {
  constructor(
    private readonly store: LocalStore,
    private readonly options: SyncClientOptions,
  ) {}

  /** One pull round. Call `pullUntilCaughtUp` to drain `hasMore` pages. */
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
          // Server won the LWW race — overwrite the local copy and drop our stale edit.
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
      const row = await this.store.db.localProject.findUnique({ where: { id: entry.recordId } });
      if (!row) return null;
      return {
        entity: 'project',
        id: row.id,
        data: { name: row.name, description: row.description, status: row.status },
        clientUpdatedAt: row.updatedAt.toISOString(),
        clientVersion: row.version,
      };
    }
    if (entry.entity === 'goal') {
      const row = await this.store.db.localGoal.findUnique({ where: { id: entry.recordId } });
      if (!row) return null;
      return {
        entity: 'goal',
        id: row.id,
        data: {
          projectId: row.projectId,
          title: row.title,
          description: row.description,
          targetDate: row.targetDate ? row.targetDate.toISOString() : null,
          status: row.status,
        },
        clientUpdatedAt: row.updatedAt.toISOString(),
        clientVersion: row.version,
      };
    }
    if (entry.entity === 'task') {
      const row = await this.store.db.localTask.findUnique({ where: { id: entry.recordId } });
      if (!row) return null;
      return {
        entity: 'task',
        id: row.id,
        data: { goalId: row.goalId, title: row.title, description: row.description, order: row.order, status: row.status },
        clientUpdatedAt: row.updatedAt.toISOString(),
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
