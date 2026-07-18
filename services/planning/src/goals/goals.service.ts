import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Goal, Prisma, PrismaService } from '@pee/database';
import { ProjectsService } from '@pee/projects';
import {
  GOAL_STATUS_CHANGED_EVENT,
  GoalProgress,
  GoalResponse,
  GoalStatus,
  PaginatedResponse,
} from '@pee/types';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ListGoalsQueryDto } from './dto/list-goals-query.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectsService: ProjectsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * `options` is populated only by internal callers (e.g. sync push) — never bound to the
   * public HTTP DTO, so a client can't set its own id/updatedAt through the plain REST endpoint.
   */
  async create(
    ownerId: string,
    projectId: string,
    dto: CreateGoalDto,
    options?: { id?: string; updatedAt?: Date },
  ): Promise<GoalResponse> {
    await this.projectsService.getOne(ownerId, projectId);
    const goal = await this.prisma.goal.create({
      data: {
        id: options?.id,
        projectId,
        ownerId,
        title: dto.title,
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        updatedAt: options?.updatedAt,
      },
    });
    return this.toResponse(goal);
  }

  async list(
    ownerId: string,
    projectId: string,
    query: ListGoalsQueryDto,
  ): Promise<PaginatedResponse<GoalResponse>> {
    await this.projectsService.getOne(ownerId, projectId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.GoalWhereInput = {
      projectId,
      ownerId,
      status: query.status ?? { not: 'ARCHIVED' },
      ...(query.search ? { title: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.goal.count({ where }),
    ]);

    return {
      data: await Promise.all(data.map((goal) => this.toResponse(goal))),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getOne(ownerId: string, id: string): Promise<GoalResponse> {
    const goal = await this.findOwnedOrThrow(ownerId, id);
    return this.toResponse(goal);
  }

  async update(
    ownerId: string,
    id: string,
    dto: UpdateGoalDto,
    options?: { updatedAt?: Date },
  ): Promise<GoalResponse> {
    const existing = await this.findOwnedOrThrow(ownerId, id);
    const goal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.targetDate !== undefined ? { targetDate: new Date(dto.targetDate) } : {}),
        ...(dto.status !== undefined
          ? { status: dto.status, completedAt: dto.status === 'COMPLETED' ? new Date() : null }
          : {}),
        ...(options?.updatedAt !== undefined ? { updatedAt: options.updatedAt } : {}),
        version: { increment: 1 },
      },
    });
    if (dto.status !== undefined && dto.status !== existing.status) {
      this.eventEmitter.emit(GOAL_STATUS_CHANGED_EVENT, {
        ownerId,
        goalId: id,
        projectId: existing.projectId,
        fromStatus: existing.status,
        toStatus: dto.status,
      });
    }
    return this.toResponse(goal);
  }

  async archive(ownerId: string, id: string): Promise<void> {
    const goal = await this.findOwnedOrThrow(ownerId, id);
    if (goal.status === 'ARCHIVED') {
      return;
    }
    await this.prisma.goal.update({ where: { id }, data: { status: 'ARCHIVED', version: { increment: 1 } } });
    this.eventEmitter.emit(GOAL_STATUS_CHANGED_EVENT, {
      ownerId,
      goalId: id,
      projectId: goal.projectId,
      fromStatus: goal.status,
      toStatus: 'ARCHIVED',
    });
  }

  /** Called by TasksService after any task mutation — this is what closes the plan/execution loop. */
  async recalculateProgress(goalId: string): Promise<void> {
    const goal = await this.prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.status === 'ARCHIVED') {
      return;
    }

    const { totalTasks, doneTasks } = await this.computeProgress(goalId);
    if (totalTasks === 0) {
      return;
    }

    const inProgressCount = await this.prisma.task.count({ where: { goalId, status: 'IN_PROGRESS' } });
    const targetStatus: GoalStatus =
      doneTasks === totalTasks ? 'COMPLETED' : doneTasks > 0 || inProgressCount > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    if (targetStatus === goal.status) {
      return;
    }
    await this.prisma.goal.update({
      where: { id: goalId },
      data: {
        status: targetStatus,
        completedAt: targetStatus === 'COMPLETED' ? new Date() : null,
        version: { increment: 1 },
      },
    });
    this.eventEmitter.emit(GOAL_STATUS_CHANGED_EVENT, {
      ownerId: goal.ownerId,
      goalId,
      projectId: goal.projectId,
      fromStatus: goal.status,
      toStatus: targetStatus,
    });
  }

  private async computeProgress(goalId: string): Promise<GoalProgress> {
    const [totalTasks, doneTasks] = await Promise.all([
      this.prisma.task.count({ where: { goalId, status: { not: 'ARCHIVED' } } }),
      this.prisma.task.count({ where: { goalId, status: 'DONE' } }),
    ]);
    const percentComplete = totalTasks === 0 ? 0 : Math.round((doneTasks / totalTasks) * 100);
    return { totalTasks, doneTasks, percentComplete };
  }

  private async findOwnedOrThrow(ownerId: string, id: string): Promise<Goal> {
    const goal = await this.prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.ownerId !== ownerId) {
      throw new NotFoundException('Goal not found');
    }
    return goal;
  }

  private async toResponse(goal: Goal): Promise<GoalResponse> {
    const progress = await this.computeProgress(goal.id);
    return {
      id: goal.id,
      projectId: goal.projectId,
      ownerId: goal.ownerId,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      targetDate: goal.targetDate ? goal.targetDate.toISOString() : null,
      completedAt: goal.completedAt ? goal.completedAt.toISOString() : null,
      progress,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }
}
