import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Omit to default to the caller's personal organization (Phase 10). */
  @IsOptional()
  @IsUUID()
  organizationId?: string;
}
