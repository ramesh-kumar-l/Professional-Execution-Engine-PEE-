import 'reflect-metadata';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min, MinLength } from 'class-validator';
import { TaskStatus } from '@pee/types';

/** Validates the opaque `data` blob of a push change for entity: 'task'. `goalId` is required for creates only. */
export class TaskSyncFieldsDto {
  @IsOptional()
  @IsUUID()
  goalId?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsEnum(['TODO', 'IN_PROGRESS', 'DONE', 'ARCHIVED'])
  status?: TaskStatus;
}
