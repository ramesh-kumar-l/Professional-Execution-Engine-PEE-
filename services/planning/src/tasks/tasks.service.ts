import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, PrismaService, Task } from '@pee/database';
import { PaginatedResponse, TASK_STATUS_CHANGED_EVENT, TaskResponse } from '@pee/types';
import { GoalsService } from '../goals/goals.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(ownerId: string, goalId: string, dto: CreateTaskDto): Promise<TaskResponse> {
    await this.goalsService.getOne(ownerId, goalId);
    const task = await this.prisma.task.create({
      data: { goalId, ownerId, title: dto.title, description: dto.description, order: dto.order ?? 0 },
    });
    await this.goalsService.recalculateProgress(goalId);
    this.eventEmitter.emit(TASK_STATUS_CHANGED_EVENT, {
      ownerId,
      taskId: task.id,
      goalId,
      fromStatus: null,
      toStatus: task.status,
    });
    return this.toResponse(task);
  }

  async list(ownerId: string, goalId: string, query: ListTasksQueryDto): Promise<PaginatedResponse<TaskResponse>> {
    await this.goalsService.getOne(ownerId, goalId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.TaskWhereInput = {
      goalId,
      ownerId,
      status: query.status ?? { not: 'ARCHIVED' },
    };

    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data: data.map((task) => this.toResponse(task)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getOne(ownerId: string, id: string): Promise<TaskResponse> {
    const task = await this.findOwnedOrThrow(ownerId, id);
    return this.toResponse(task);
  }

  async update(ownerId: string, id: string, dto: UpdateTaskDto): Promise<TaskResponse> {
    const existing = await this.findOwnedOrThrow(ownerId, id);
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.status !== undefined
          ? { status: dto.status, completedAt: dto.status === 'DONE' ? new Date() : null }
          : {}),
      },
    });
    if (dto.status !== undefined && dto.status !== existing.status) {
      await this.goalsService.recalculateProgress(existing.goalId);
      this.eventEmitter.emit(TASK_STATUS_CHANGED_EVENT, {
        ownerId,
        taskId: id,
        goalId: existing.goalId,
        fromStatus: existing.status,
        toStatus: dto.status,
      });
    }
    return this.toResponse(task);
  }

  async archive(ownerId: string, id: string): Promise<void> {
    const task = await this.findOwnedOrThrow(ownerId, id);
    if (task.status === 'ARCHIVED') {
      return;
    }
    await this.prisma.task.update({ where: { id }, data: { status: 'ARCHIVED' } });
    await this.goalsService.recalculateProgress(task.goalId);
    this.eventEmitter.emit(TASK_STATUS_CHANGED_EVENT, {
      ownerId,
      taskId: id,
      goalId: task.goalId,
      fromStatus: task.status,
      toStatus: 'ARCHIVED',
    });
  }

  private async findOwnedOrThrow(ownerId: string, id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.ownerId !== ownerId) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  private toResponse(task: Task): TaskResponse {
    return {
      id: task.id,
      goalId: task.goalId,
      ownerId: task.ownerId,
      title: task.title,
      description: task.description,
      status: task.status,
      order: task.order,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }
}
