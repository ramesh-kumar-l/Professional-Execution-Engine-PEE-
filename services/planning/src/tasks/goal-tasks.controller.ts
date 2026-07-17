import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { PaginatedResponse, TaskResponse } from '@pee/types';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('goals/:goalId/tasks')
export class GoalTasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('goalId') goalId: string,
    @Body() dto: CreateTaskDto,
  ): Promise<TaskResponse> {
    return this.tasksService.create(user.id, goalId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('goalId') goalId: string,
    @Query() query: ListTasksQueryDto,
  ): Promise<PaginatedResponse<TaskResponse>> {
    return this.tasksService.list(user.id, goalId, query);
  }
}
