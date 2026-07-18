import * as Crypto from 'expo-crypto';
import { SyncChangeRecord } from '@pee/types';
import { SQLiteExecutor } from './connection';
import { LocalGoalFields, LocalGoalRow } from './types';

/** Mirrors packages/local-client/src/local-store.ts's createGoal/updateGoal/
 *  applyServerChange('goal') — same field shapes, ported onto raw SQL. */
export class GoalsRepo {
  constructor(private readonly db: SQLiteExecutor) {}

  async create(ownerId: string, fields: LocalGoalFields): Promise<LocalGoalRow> {
    const row: LocalGoalRow = {
      id: Crypto.randomUUID(),
      ownerId,
      projectId: fields.projectId,
      title: fields.title,
      description: fields.description ?? null,
      targetDate: fields.targetDate ? fields.targetDate.toISOString() : null,
      status: fields.status ?? 'NOT_STARTED',
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await this.db.runAsync(
      `INSERT INTO local_goals (id, ownerId, projectId, title, description, targetDate, status, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.ownerId, row.projectId, row.title, row.description, row.targetDate, row.status, row.updatedAt, row.version],
    );
    return row;
  }

  async update(id: string, fields: Partial<LocalGoalFields>): Promise<LocalGoalRow> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Local goal ${id} not found`);
    const next: LocalGoalRow = {
      ...current,
      title: fields.title ?? current.title,
      description: fields.description !== undefined ? fields.description : current.description,
      targetDate: fields.targetDate !== undefined ? (fields.targetDate ? fields.targetDate.toISOString() : null) : current.targetDate,
      status: fields.status ?? current.status,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };
    await this.db.runAsync(
      `UPDATE local_goals SET title = ?, description = ?, targetDate = ?, status = ?, updatedAt = ?, version = ? WHERE id = ?`,
      [next.title, next.description, next.targetDate, next.status, next.updatedAt, next.version, id],
    );
    return next;
  }

  async getById(id: string): Promise<LocalGoalRow | null> {
    return this.db.getFirstAsync<LocalGoalRow>(`SELECT * FROM local_goals WHERE id = ?`, [id]);
  }

  async listByProject(projectId: string): Promise<LocalGoalRow[]> {
    return this.db.getAllAsync<LocalGoalRow>(`SELECT * FROM local_goals WHERE projectId = ? ORDER BY updatedAt DESC`, [projectId]);
  }

  async applyServerChange(change: SyncChangeRecord): Promise<void> {
    const data = change.data as {
      projectId: string;
      title: string;
      description: string | null;
      targetDate: string | null;
      status: string;
    };
    const updatedAt = new Date(change.updatedAt).toISOString();
    const targetDate = data.targetDate ? new Date(data.targetDate).toISOString() : null;
    const existing = await this.getById(change.id);
    if (existing) {
      await this.db.runAsync(
        `UPDATE local_goals SET title = ?, description = ?, targetDate = ?, status = ?, updatedAt = ?, version = ? WHERE id = ?`,
        [data.title, data.description, targetDate, data.status, updatedAt, change.version, change.id],
      );
    } else {
      await this.db.runAsync(
        `INSERT INTO local_goals (id, ownerId, projectId, title, description, targetDate, status, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [change.id, change.ownerId, data.projectId, data.title, data.description, targetDate, data.status, updatedAt, change.version],
      );
    }
  }
}
