import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { AnalyticsSummaryResponse, AnalyticsTimeTrackingResponse, AnalyticsVelocityResponse } from '@pee/types';
import { TimeTrackingQueryDto } from './dto/time-tracking-query.dto';
import { VelocityQueryDto } from './dto/velocity-query.dto';
import { SummaryService } from './summary/summary.service';
import { TimeTrackingService } from './time-tracking/time-tracking.service';
import { VelocityService } from './velocity/velocity.service';

@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly summaryService: SummaryService,
    private readonly velocityService: VelocityService,
    private readonly timeTrackingService: TimeTrackingService,
  ) {}

  @Get('summary')
  getSummary(@CurrentUser() user: CurrentUserPayload): Promise<AnalyticsSummaryResponse> {
    return this.summaryService.getSummary(user.id);
  }

  @Get('velocity')
  getVelocity(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: VelocityQueryDto,
  ): Promise<AnalyticsVelocityResponse> {
    return this.velocityService.getVelocity(user.id, query.days ?? 30);
  }

  @Get('time-tracking')
  getTimeTracking(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: TimeTrackingQueryDto,
  ): Promise<AnalyticsTimeTrackingResponse> {
    return this.timeTrackingService.getTimeTracking(user.id, query.groupBy ?? 'goal', query.sinceDays ?? 90);
  }
}
