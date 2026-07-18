import * as Crypto from 'expo-crypto';
import { SyncChangeRecord } from '@pee/types';
import { SQLiteExecutor } from './connection';
import { LocalProjectFields, LocalProjectRow } from './types';

/** Mirrors packages/local-client/src/local-store.ts's createProject/updateProject/
 *  applyServerChange('project') — same field shapes, ported onto raw SQL. */
export class ProjectsRepo {
  constructor(private readonly db: SQLiteExecutor) {}

  async create(ownerId: string, fields: LocalProjectFields): Promise<LocalProjectRow> {
    const row: LocalProjectRow = {
      id: Crypto.randomUUID(),
      ownerId,
      name: fields.name,
      description: fields.description ?? null,
      status: fields.status ?? 'ACTIVE',
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    await this.db.runAsync(
      `INSERT INTO local_projects (id, ownerId, name, description, status, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.ownerId, row.name, row.description, row.status, row.updatedAt, row.version],
    );
    return row;
  }

  async update(id: string, fields: Partial<LocalProjectFields>): Promise<LocalProjectRow> {
    const current = await this.getById(id);
    if (!current) throw new Error(`Local project ${id} not found`);
    const next: LocalProjectRow = {
      ...current,
      name: fields.name ?? current.name,
      description: fields.description !== undefined ? fields.description : current.description,
      status: fields.status ?? current.status,
      updatedAt: new Date().toISOString(),
      version: current.version + 1,
    };
    await this.db.runAsync(
      `UPDATE local_projects SET name = ?, description = ?, status = ?, updatedAt = ?, version = ? WHERE id = ?`,
      [next.name, next.description, next.status, next.updatedAt, next.version, id],
    );
    return next;
  }

  async getById(id: string): Promise<LocalProjectRow | null> {
    return this.db.getFirstAsync<LocalProjectRow>(`SELECT * FROM local_projects WHERE id = ?`, [id]);
  }

  async listByOwner(ownerId: string): Promise<LocalProjectRow[]> {
    return this.db.getAllAsync<LocalProjectRow>(`SELECT * FROM local_projects WHERE ownerId = ? ORDER BY updatedAt DESC`, [ownerId]);
  }

  /** Writes an incoming pull change straight into the table — never touches the outbox. */
  async applyServerChange(change: SyncChangeRecord): Promise<void> {
    const data = change.data as { name: string; description: string | null; status: string };
    const updatedAt = new Date(change.updatedAt).toISOString();
    const existing = await this.getById(change.id);
    if (existing) {
      await this.db.runAsync(
        `UPDATE local_projects SET name = ?, description = ?, status = ?, updatedAt = ?, version = ? WHERE id = ?`,
        [data.name, data.description, data.status, updatedAt, change.version, change.id],
      );
    } else {
      await this.db.runAsync(
        `INSERT INTO local_projects (id, ownerId, name, description, status, updatedAt, version) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [change.id, change.ownerId, data.name, data.description, data.status, updatedAt, change.version],
      );
    }
  }
}
