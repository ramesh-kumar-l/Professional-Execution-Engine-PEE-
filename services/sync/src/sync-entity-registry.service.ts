import { Injectable } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { GoalsService, TasksService } from '@pee/planning';
import { ProjectsService } from '@pee/projects';
import { SyncChangeRecord, SyncableEntityName } from '@pee/types';
import { GoalSyncFieldsDto } from './dto/entity-payloads/goal-sync-fields.dto';
import { ProjectSyncFieldsDto } from './dto/entity-payloads/project-sync-fields.dto';
import { TaskSyncFieldsDto } from './dto/entity-payloads/task-sync-fields.dto';

/**
 * A Prisma model row belonging to one of the syncable tables. All three (Project/Goal/Task)
 * share this shape (id/ownerId/updatedAt/version), which is what lets pull/push stay generic.
 */
export interface SyncRow {
  id: string;
  ownerId: string;
  updatedAt: Date;
  version: number;
  [field: string]: unknown;
}

/**
 * `payload` is typed `any` here deliberately: each entry's actual payload shape (Project/Goal/Task
 * sync-fields DTO) is already runtime-validated against `payloadClass` via `validatePayload()`
 * before `applyCreate`/`applyUpdate` ever runs — this interface just erases that per-entity type at
 * the registry boundary so the three entries can share one array without generics collapsing to `object`.
 */
export interface SyncEntityDefinition {
  name: SyncableEntityName;
  delegate: {
    findMany(args: unknown): Promise<SyncRow[]>;
    findUnique(args: unknown): Promise<SyncRow | null>;
    updateMany(args: unknown): Promise<{ count: number }>;
  };
  payloadClass: new () => object;
  /** Throws on a missing required field or an unowned/missing parent — caller maps that to a 'rejected' result. */
  applyCreate(ownerId: string, id: string, payload: any, updatedAt: Date): Promise<void>;
  applyUpdate(ownerId: string, id: string, payload: any, updatedAt: Date): Promise<void>;
  toChangeRecord(row: SyncRow): SyncChangeRecord;
}

/** Registers the three mutable, user-owned entities that support bidirectional sync (see adr/0003, Phase 5). */
@Injectable()
export class SyncEntityRegistryService {
  readonly entities: SyncEntityDefinition[];

  constructor(
    prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly goalsService: GoalsService,
    private readonly tasksService: TasksService,
  ) {
    this.entities = [
      {
        name: 'project',
        delegate: prisma.project,
        payloadClass: ProjectSyncFieldsDto,
        applyCreate: async (ownerId, id, payload, updatedAt) => {
          if (!payload.name) throw new Error('missing_required_field:name');
          await this.projectsService.create(ownerId, { name: payload.name, description: payload.description }, { id, updatedAt });
        },
        applyUpdate: async (ownerId, id, payload, updatedAt) => {
          await this.projectsService.update(ownerId, id, payload, { updatedAt });
        },
        toChangeRecord: (row) => ({
          entity: 'project',
          id: row.id,
          ownerId: row.ownerId,
          data: { name: row.name, description: row.description, status: row.status },
          updatedAt: row.updatedAt.toISOString(),
          version: row.version,
        }),
      },
      {
        name: 'goal',
        delegate: prisma.goal,
        payloadClass: GoalSyncFieldsDto,
        applyCreate: async (ownerId, id, payload, updatedAt) => {
          if (!payload.title || !payload.projectId) throw new Error('missing_required_field:title_or_projectId');
          await this.goalsService.create(
            ownerId,
            payload.projectId,
            { title: payload.title, description: payload.description, targetDate: payload.targetDate },
            { id, updatedAt },
          );
        },
        applyUpdate: async (ownerId, id, payload, updatedAt) => {
          await this.goalsService.update(ownerId, id, payload, { updatedAt });
        },
        toChangeRecord: (row) => ({
          entity: 'goal',
          id: row.id,
          ownerId: row.ownerId,
          data: {
            projectId: row.projectId,
            title: row.title,
            description: row.description,
            targetDate: row.targetDate ? (row.targetDate as Date).toISOString() : null,
            status: row.status,
          },
          updatedAt: row.updatedAt.toISOString(),
          version: row.version,
        }),
      },
      {
        name: 'task',
        delegate: prisma.task,
        payloadClass: TaskSyncFieldsDto,
        applyCreate: async (ownerId, id, payload, updatedAt) => {
          if (!payload.title || !payload.goalId) throw new Error('missing_required_field:title_or_goalId');
          await this.tasksService.create(
            ownerId,
            payload.goalId,
            { title: payload.title, description: payload.description, order: payload.order },
            { id, updatedAt },
          );
        },
        applyUpdate: async (ownerId, id, payload, updatedAt) => {
          await this.tasksService.update(ownerId, id, payload, { updatedAt });
        },
        toChangeRecord: (row) => ({
          entity: 'task',
          id: row.id,
          ownerId: row.ownerId,
          data: { goalId: row.goalId, title: row.title, description: row.description, order: row.order, status: row.status },
          updatedAt: row.updatedAt.toISOString(),
          version: row.version,
        }),
      },
    ];
  }

  find(name: SyncableEntityName): SyncEntityDefinition | undefined {
    return this.entities.find((entity) => entity.name === name);
  }
}
