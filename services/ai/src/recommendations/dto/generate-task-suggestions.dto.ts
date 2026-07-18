import 'reflect-metadata';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateTaskSuggestionsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  maxSuggestions?: number = 5;
}
