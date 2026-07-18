import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { ExecutionEventResponse, PaginatedResponse } from '@pee/types';
import { ListExecutionEventsQueryDto } from '../dto/list-execution-events-query.dto';
import { ExecutionEventsService } from './execution-events.service';

@UseGuards(JwtAuthGuard)
@Controller('goals/:goalId/activity')
export class GoalActivityController {
  constructor(private readonly executionEventsService: ExecutionEventsService) {}

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('goalId') goalId: string,
    @Query() query: ListExecutionEventsQueryDto,
  ): Promise<PaginatedResponse<ExecutionEventResponse>> {
    return this.executionEventsService.listGoalActivity(user.id, goalId, query);
  }
}
