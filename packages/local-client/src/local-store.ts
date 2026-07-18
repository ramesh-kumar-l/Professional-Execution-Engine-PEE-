import { randomUUID } from 'crypto';
import { SyncChangeRecord, SyncableEntityName } from '@pee/types';
import { PrismaClient } from '../prisma/generated/client';

export interface LocalProjectFields {
  name: string;
  description?: string | null;
  status?: string;
}

export interface LocalGoalFields {
  projectId: string;
  title: string;
  description?: string | null;
  targetDate?: Date | null;
  status?: string;
}

export interface LocalTaskFields {
  goalId: string;
  title: string;
  description?: string | null;
  order?: number;
  status?: string;
}

export interface PendingOutboxEntry {
  id: string;
  entity: SyncableEntityName;
  recordId: string;
}

/**
 * The local, offline-capable half of the sync protocol. Every write goes straight to SQLite and
 * is immediately usable — the outbox is just a durable "needs to sync" marker, not a blocker.
 */
export class LocalStore {
  readonly db: PrismaClient;

  constructor(databaseUrl: string) {
    this.db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  }

  async close(): Promise<void> {
    await this.db.$disconnect();
  }

  async createProject(ownerId: string, fields: LocalProjectFields) {
    const id = randomUUID();
    const row = await this.db.localProject.create({
      data: { id, ownerId, status: 'ACTIVE', ...fields, updatedAt: new Date(), version: 1 },
    });
    await this.enqueueOutbox('project', id);
    return row;
  }

  async updateProject(id: string, fields: Partial<LocalProjectFields>) {
    const row = await this.db.localProject.update({
      where: { id },
      data: { ...fields, updatedAt: new Date(), version: { increment: 1 } },
    });
    await this.enqueueOutbox('project', id);
    return row;
  }

  async createGoal(ownerId: string, fields: LocalGoalFields) {
    const id = randomUUID();
    const row = await this.db.localGoal.create({
      data: { id, ownerId, status: 'NOT_STARTED', ...fields, updatedAt: new Date(), version: 1 },
    });
    await this.enqueueOutbox('goal', id);
    return row;
  }

  async updateGoal(id: string, fields: Partial<LocalGoalFields>) {
    const row = await this.db.localGoal.update({
      where: { id },
      data: { ...fields, updatedAt: new Date(), version: { increment: 1 } },
    });
    await this.enqueueOutbox('goal', id);
    return row;
  }

  async createTask(ownerId: string, fields: LocalTaskFields) {
    const id = randomUUID();
    const row = await this.db.localTask.create({
      data: { id, ownerId, order: 0, status: 'TODO', ...fields, updatedAt: new Date(), version: 1 },
    });
    await this.enqueueOutbox('task', id);
    return row;
  }

  async updateTask(id: string, fields: Partial<LocalTaskFields>) {
    const row = await this.db.localTask.update({
      where: { id },
      data: { ...fields, updatedAt: new Date(), version: { increment: 1 } },
    });
    await this.enqueueOutbox('task', id);
    return row;
  }

  /** Writes an incoming pull change straight into the matching local table — never touches the outbox. */
  async applyServerChange(change: SyncChangeRecord): Promise<void> {
    const updatedAt = new Date(change.updatedAt);
    const base = { id: change.id, ownerId: change.ownerId, updatedAt, version: change.version };

    if (change.entity === 'project') {
      const data = change.data as { name: string; description: string | null; status: string };
      await this.db.localProject.upsert({
        where: { id: change.id },
        create: { ...base, name: data.name, description: data.description, status: data.status },
        update: { name: data.name, description: data.description, status: data.status, updatedAt, version: change.version },
      });
    } else if (change.entity === 'goal') {
      const data = change.data as {
        projectId: string;
        title: string;
        description: string | null;
        targetDate: string | null;
        status: string;
      };
      const targetDate = data.targetDate ? new Date(data.targetDate) : null;
      await this.db.localGoal.upsert({
        where: { id: change.id },
        create: { ...base, projectId: data.projectId, title: data.title, description: data.description, targetDate, status: data.status },
        update: { title: data.title, description: data.description, targetDate, status: data.status, updatedAt, version: change.version },
      });
    } else if (change.entity === 'task') {
      const data = change.data as { goalId: string; title: string; description: string | null; order: number; status: string };
      await this.db.localTask.upsert({
        where: { id: change.id },
        create: { ...base, goalId: data.goalId, title: data.title, description: data.description, order: data.order, status: data.status },
        update: { title: data.title, description: data.description, order: data.order, status: data.status, updatedAt, version: change.version },
      });
    }
  }

  private async enqueueOutbox(entity: SyncableEntityName, recordId: string): Promise<void> {
    await this.db.syncOutboxEntry.create({ data: { entity, recordId } });
  }

  async listPendingOutbox(): Promise<PendingOutboxEntry[]> {
    const entries = await this.db.syncOutboxEntry.findMany({ where: { pushedAt: null }, orderBy: { createdAt: 'asc' } });
    return entries.map((entry) => ({ id: entry.id, entity: entry.entity as SyncableEntityName, recordId: entry.recordId }));
  }

  async markOutboxPushed(outboxId: string): Promise<void> {
    await this.db.syncOutboxEntry.update({ where: { id: outboxId }, data: { pushedAt: new Date() } });
  }

  async getCursor(entity: string): Promise<string | undefined> {
    const row = await this.db.syncCursor.findUnique({ where: { entity } });
    return row?.cursor;
  }

  async setCursor(entity: string, cursor: string): Promise<void> {
    await this.db.syncCursor.upsert({ where: { entity }, create: { entity, cursor }, update: { cursor } });
  }
}
