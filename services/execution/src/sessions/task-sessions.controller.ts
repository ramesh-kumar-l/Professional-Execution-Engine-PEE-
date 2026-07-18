import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { TaskExecutionSessionResponse } from '@pee/types';
import { TaskSessionsService } from './task-sessions.service';

@UseGuards(JwtAuthGuard)
@Controller('tasks/:taskId/execution')
export class TaskSessionsController {
  constructor(private readonly taskSessionsService: TaskSessionsService) {}

  @Post('start')
  @HttpCode(201)
  start(
    @CurrentUser() user: CurrentUserPayload,
    @Param('taskId') taskId: string,
  ): Promise<TaskExecutionSessionResponse> {
    return this.taskSessionsService.startTask(user.id, taskId);
  }

  @Post('complete')
  complete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('taskId') taskId: string,
  ): Promise<TaskExecutionSessionResponse> {
    return this.taskSessionsService.completeTask(user.id, taskId);
  }
}
