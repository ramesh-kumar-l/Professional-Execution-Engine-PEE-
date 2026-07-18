import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { SummaryService } from './summary/summary.service';
import { TimeTrackingService } from './time-tracking/time-tracking.service';
import { VelocityService } from './velocity/velocity.service';

@Module({
  controllers: [AnalyticsController],
  providers: [SummaryService, VelocityService, TimeTrackingService],
  exports: [SummaryService, VelocityService, TimeTrackingService],
})
export class AnalyticsModule {}
