import 'reflect-metadata';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ProjectStatus } from '@pee/types';

export class ListProjectsQueryDto {
  /** Omit to list across every organization the caller belongs to (Phase 10). */
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(['ACTIVE', 'ARCHIVED'])
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
