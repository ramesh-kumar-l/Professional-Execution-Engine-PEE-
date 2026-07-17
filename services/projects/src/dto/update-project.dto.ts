import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ProjectStatus } from '@pee/types';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(['ACTIVE', 'ARCHIVED'])
  status?: ProjectStatus;
}
