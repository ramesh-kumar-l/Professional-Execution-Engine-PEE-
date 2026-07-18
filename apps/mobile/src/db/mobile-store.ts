import { SyncChangeRecord } from '@pee/types';
import { SQLiteExecutor } from './connection';
import { GoalsRepo } from './goals-repo';
import { OutboxRepo } from './outbox-repo';
import { ProjectsRepo } from './projects-repo';
import { TasksRepo } from './tasks-repo';
import { LocalGoalFields, LocalProjectFields, LocalTaskFields, PendingOutboxEntry } from './types';

export type { LocalGoalFields, LocalProjectFields, LocalTaskFields, PendingOutboxEntry } from './types';

/**
 * The mobile equivalent of packages/local-client/src/local-store.ts's LocalStore — same public
 * method surface, same "every write is immediately durable plus an outbox marker" behavior, but
 * backed by expo-sqlite instead of Prisma (see adr/0008 for why Prisma can't run on this runtime).
 * Composes per-entity repos rather than one large class, per this project's file-size discipline.
 */
export class MobileStore {
  readonly projects: ProjectsRepo;
  readonly goals: GoalsRepo;
  readonly tasks: TasksRepo;
  private readonly outbox: OutboxRepo;

  constructor(db: SQLiteExecutor) {
    this.projects = new ProjectsRepo(db);
    this.goals = new GoalsRepo(db);
    this.tasks = new TasksRepo(db);
    this.outbox = new OutboxRepo(db);
  }

  async createProject(ownerId: string, fields: LocalProjectFields) {
    const row = await this.projects.create(ownerId, fields);
    await this.outbox.enqueue('project', row.id);
    return row;
  }

  async updateProject(id: string, fields: Partial<LocalProjectFields>) {
    const row = await this.projects.update(id, fields);
    await this.outbox.enqueue('project', id);
    return row;
  }

  async createGoal(ownerId: string, fields: LocalGoalFields) {
    const row = await this.goals.create(ownerId, fields);
    await this.outbox.enqueue('goal', row.id);
    return row;
  }

  async updateGoal(id: string, fields: Partial<LocalGoalFields>) {
    const row = await this.goals.update(id, fields);
    await this.outbox.enqueue('goal', id);
    return row;
  }

  async createTask(ownerId: string, fields: LocalTaskFields) {
    const row = await this.tasks.create(ownerId, fields);
    await this.outbox.enqueue('task', row.id);
    return row;
  }

  async updateTask(id: string, fields: Partial<LocalTaskFields>) {
    const row = await this.tasks.update(id, fields);
    await this.outbox.enqueue('task', id);
    return row;
  }

  /** Writes an incoming pull change straight into the matching local table — never touches the outbox. */
  async applyServerChange(change: SyncChangeRecord): Promise<void> {
    if (change.entity === 'project') await this.projects.applyServerChange(change);
    else if (change.entity === 'goal') await this.goals.applyServerChange(change);
    else if (change.entity === 'task') await this.tasks.applyServerChange(change);
  }

  async listPendingOutbox(): Promise<PendingOutboxEntry[]> {
    return this.outbox.listPending();
  }

  async markOutboxPushed(outboxId: string): Promise<void> {
    await this.outbox.markPushed(outboxId);
  }

  async getCursor(entity: string): Promise<string | undefined> {
    return this.outbox.getCursor(entity);
  }

  async setCursor(entity: string, cursor: string): Promise<void> {
    await this.outbox.setCursor(entity, cursor);
  }
}
