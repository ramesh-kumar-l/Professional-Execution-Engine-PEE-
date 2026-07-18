import * as Crypto from 'expo-crypto';
import { SyncChangeRecord } from '@pee/types';
import { SQLiteExecutor } from './connection';
import { LocalTaskFields, LocalTaskRow } from './types';

/** Mirrors packages/local-client/src/local-store.ts's createTask/updateTask/
 *  applyServerChange('task') — same field shapes, ported onto raw SQL. */
export class TasksRepo {
  constructor(private readonly db: SQLiteExecutor) {}

  async create(ownerId: string, fields: LocalTaskFields): Promise<LocalTaskRow> {
    const row: LocalTaskRow = {
      id: Crypto.randomUUID(),
      ownerId,
      goalId: fields.goalId,
      title: fields.title,
      description: fields.description ?? null,
      order: fields.order ?? 0,
      status: fields.status ?? 'TODO',
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await this.db.runAsync(
      `INSERT INTO local_tasks (id, ownerId, goalId, title, description, "order", status, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.ownerId, row.goalId, row.title, row.description, row.order, row.status, row.updatedAt, row.version],
    );
    return row;
  }

  async update(id: string, fields: Partial<LocalTaskFields>): Promise<LocalTaskRow> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Local task ${id} not found`);
    const next: LocalTaskRow = {
      ...current,
      title: fields.title ?? current.title,
      description: fields.description !== undefined ? fields.description : current.description,
      order: fields.order ?? current.order,
      status: fields.status ?? current.status,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };
    await this.db.runAsync(
      `UPDATE local_tasks SET title = ?, description = ?, "order" = ?, status = ?, updatedAt = ?, version = ? WHERE id = ?`,
      [next.title, next.description, next.order, next.status, next.updatedAt, next.version, id],
    );
    return next;
  }

  async getById(id: string): Promise<LocalTaskRow | null> {
    return this.db.getFirstAsync<LocalTaskRow>(`SELECT * FROM local_tasks WHERE id = ?`, [id]);
  }

  async listByGoal(goalId: string): Promise<LocalTaskRow[]> {
    return this.db.getAllAsync<LocalTaskRow>(`SELECT * FROM local_tasks WHERE goalId = ? ORDER BY "order" ASC`, [goalId]);
  }

  async applyServerChange(change: SyncChangeRecord): Promise<void> {
    const data = change.data as { goalId: string; title: string; description: string | null; order: number; status: string };
    const updatedAt = new Date(change.updatedAt).toISOString();
    const existing = await this.getById(change.id);
    if (existing) {
      await this.db.runAsync(
        `UPDATE local_tasks SET title = ?, description = ?, "order" = ?, status = ?, updatedAt = ?, version = ? WHERE id = ?`,
        [data.title, data.description, data.order, data.status, updatedAt, change.version, change.id],
      );
    } else {
      await this.db.runAsync(
        `INSERT INTO local_tasks (id, ownerId, goalId, title, description, "order", status, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [change.id, change.ownerId, data.goalId, data.title, data.description, data.order, data.status, updatedAt, change.version],
      );
    }
  }
}
