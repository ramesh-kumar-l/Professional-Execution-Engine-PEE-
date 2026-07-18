import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ExecutionEvent, PrismaService } from '@pee/database';
import { GoalsService } from '@pee/planning';
import {
  ActiveExecutionResponse,
  ExecutionEventResponse,
  ExecutionEventType,
  GOAL_STATUS_CHANGED_EVENT,
  GoalStatusChangedEvent,
  ListExecutionEventsQuery,
  PaginatedResponse,
  TASK_STATUS_CHANGED_EVENT,
  TaskStatusChangedEvent,
} from '@pee/types';

@Injectable()
export class ExecutionEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
  ) {}

  /** Fires unconditionally on every task status change, regardless of entry point (start/complete or a plain PATCH). */
  @OnEvent(TASK_STATUS_CHANGED_EVENT)
  async handleTaskStatusChanged(payload: TaskStatusChangedEvent): Promise<void> {
    await this.prisma.executionEvent.create({
      data: {
        ownerId: payload.ownerId,
        taskId: payload.taskId,
        goalId: payload.goalId,
        eventType: this.mapTaskEventType(payload.toStatus),
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
      },
    });
  }

  @OnEvent(GOAL_STATUS_CHANGED_EVENT)
  async handleGoalStatusChanged(payload: GoalStatusChangedEvent): Promise<void> {
    await this.prisma.executionEvent.create({
      data: {
        ownerId: payload.ownerId,
        goalId: payload.goalId,
        eventType: 'GOAL_STATUS_CHANGED',
        fromStatus: payload.fromStatus,
        toStatus: payload.toStatus,
      },
    });
  }

  async listGoalActivity(
    ownerId: string,
    goalId: string,
    query: ListExecutionEventsQuery,
  ): Promise<PaginatedResponse<ExecutionEventResponse>> {
    await this.goalsService.getOne(ownerId, goalId);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where = { goalId, ownerId };

    const [data, total] = await Promise.all([
      this.prisma.executionEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.executionEvent.count({ where }),
    ]);

    return {
      data: data.map((event) => this.toResponse(event)),
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Everything currently running, across every project/goal — the end-to-end observability view. */
  async listActiveSessions(ownerId: string): Promise<ActiveExecutionResponse[]> {
    const sessions = await this.prisma.taskExecutionSession.findMany({
      where: { ownerId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      include: { task: { include: { goal: true } } },
    });

    return sessions.map((session) => ({
      session: {
        id: session.id,
        taskId: session.taskId,
        startedAt: session.startedAt.toISOString(),
        endedAt: null,
        durationSeconds: null,
      },
      taskTitle: session.task.title,
      goalId: session.task.goalId,
      goalTitle: session.task.goal.title,
    }));
  }

  private mapTaskEventType(toStatus: string): ExecutionEventType {
    if (toStatus === 'ARCHIVED') return 'TASK_ARCHIVED';
    if (toStatus === 'DONE') return 'TASK_COMPLETED';
    if (toStatus === 'IN_PROGRESS') return 'TASK_STARTED';
    return 'TASK_STATUS_CHANGED';
  }

  private toResponse(event: ExecutionEvent): ExecutionEventResponse {
    return {
      id: event.id,
      ownerId: event.ownerId,
      goalId: event.goalId,
      taskId: event.taskId,
      eventType: event.eventType,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      createdAt: event.createdAt.toISOString(),
    };
  }
}
