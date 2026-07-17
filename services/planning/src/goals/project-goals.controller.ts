import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { GoalResponse, PaginatedResponse } from '@pee/types';
import { CreateGoalDto } from './dto/create-goal.dto';
import { ListGoalsQueryDto } from './dto/list-goals-query.dto';
import { GoalsService } from './goals.service';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/goals')
export class ProjectGoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @HttpCode(201)
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId') projectId: string,
    @Body() dto: CreateGoalDto,
  ): Promise<GoalResponse> {
    return this.goalsService.create(user.id, projectId, dto);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('projectId') projectId: string,
    @Query() query: ListGoalsQueryDto,
  ): Promise<PaginatedResponse<GoalResponse>> {
    return this.goalsService.list(user.id, projectId, query);
  }
}
