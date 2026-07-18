import { SyncableEntityName } from '@pee/types';
import { SQLiteExecutor } from './connection';
import { PendingOutboxEntry } from './types';

/** The local-first "outbox": every local write is recorded here until push confirms it landed on
 *  the server — mirrors packages/local-client/src/local-store.ts's enqueueOutbox/listPendingOutbox. */
export class OutboxRepo {
  constructor(private readonly db: SQLiteExecutor) {}

  async enqueue(entity: SyncableEntityName, recordId: string): Promise<void> {
    const id = `${entity}:${recordId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    await this.db.runAsync(
      `INSERT INTO sync_outbox_entries (id, entity, recordId, createdAt, pushedAt) VALUES (?, ?, ?, ?, NULL)`,
      [id, entity, recordId, new Date().toISOString()],
    );
  }

  async listPending(): Promise<PendingOutboxEntry[]> {
    const rows = await this.db.getAllAsync<{ id: string; entity: string; recordId: string }>(
      `SELECT id, entity, recordId FROM sync_outbox_entries WHERE pushedAt IS NULL ORDER BY createdAt ASC`,
    );
    return rows.map((row) => ({ id: row.id, entity: row.entity as SyncableEntityName, recordId: row.recordId }));
  }

  async markPushed(outboxId: string): Promise<void> {
    await this.db.runAsync(`UPDATE sync_outbox_entries SET pushedAt = ? WHERE id = ?`, [new Date().toISOString(), outboxId]);
  }

  async getCursor(entity: string): Promise<string | undefined> {
    const row = await this.db.getFirstAsync<{ cursor: string }>(`SELECT cursor FROM sync_cursors WHERE entity = ?`, [entity]);
    return row?.cursor;
  }

  async setCursor(entity: string, cursor: string): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO sync_cursors (entity, cursor) VALUES (?, ?) ON CONFLICT(entity) DO UPDATE SET cursor = excluded.cursor`,
      [entity, cursor],
    );
  }
}
