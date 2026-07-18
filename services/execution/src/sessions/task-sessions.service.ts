import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService, TaskExecutionSession } from '@pee/database';
import { TasksService } from '@pee/planning';
import { TaskExecutionSessionResponse } from '@pee/types';

@Injectable()
export class TaskSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tasksService: TasksService,
  ) {}

  async startTask(ownerId: string, taskId: string): Promise<TaskExecutionSessionResponse> {
    await this.tasksService.getOne(ownerId, taskId);
    const openSession = await this.prisma.taskExecutionSession.findFirst({
      where: { taskId, ownerId, endedAt: null },
    });
    if (openSession) {
      throw new ConflictException('Task already has an active execution session');
    }

    const session = await this.prisma.taskExecutionSession.create({ data: { taskId, ownerId } });
    // Reuses TasksService.update — this is what fires the task.status_changed event
    // that ExecutionEventsService listens for, so no logging logic is duplicated here.
    await this.tasksService.update(ownerId, taskId, { status: 'IN_PROGRESS' });
    return this.toResponse(session);
  }

  async completeTask(ownerId: string, taskId: string): Promise<TaskExecutionSessionResponse> {
    await this.tasksService.getOne(ownerId, taskId);
    const openSession = await this.prisma.taskExecutionSession.findFirst({
      where: { taskId, ownerId, endedAt: null },
    });
    if (!openSession) {
      throw new NotFoundException('No active execution session for this task');
    }

    const endedAt = new Date();
    const durationSeconds = Math.round((endedAt.getTime() - openSession.startedAt.getTime()) / 1000);
    const session = await this.prisma.taskExecutionSession.update({
      where: { id: openSession.id },
      data: { endedAt, durationSeconds },
    });
    // Reuses TasksService.update — triggers the Phase 3 goal-progress rollup and the events, in one call.
    await this.tasksService.update(ownerId, taskId, { status: 'DONE' });
    return this.toResponse(session);
  }

  private toResponse(session: TaskExecutionSession): TaskExecutionSessionResponse {
    return {
      id: session.id,
      taskId: session.taskId,
      startedAt: session.startedAt.toISOString(),
      endedAt: session.endedAt ? session.endedAt.toISOString() : null,
      durationSeconds: session.durationSeconds,
    };
  }
}
