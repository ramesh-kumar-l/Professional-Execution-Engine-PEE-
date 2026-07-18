import 'reflect-metadata';
import { IsDateString, IsOptional } from 'class-validator';

export class SyncPullQueryDto {
  @IsOptional()
  @IsDateString()
  since?: string;
}
