import { Body, Controller, Delete, Get, HttpCode, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { GoalResponse } from '@pee/types';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GoalsService } from './goals.service';

@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get(':id')
  getOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string): Promise<GoalResponse> {
    return this.goalsService.getOne(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ): Promise<GoalResponse> {
    return this.goalsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  archive(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string): Promise<void> {
    return this.goalsService.archive(user.id, id);
  }
}
