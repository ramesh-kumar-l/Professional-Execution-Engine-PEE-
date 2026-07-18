import 'reflect-metadata';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AnalyticsGroupBy } from '@pee/types';

export class TimeTrackingQueryDto {
  @IsOptional()
  @IsIn(['goal', 'project'])
  groupBy?: AnalyticsGroupBy = 'goal';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  sinceDays?: number = 90;
}
