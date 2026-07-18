import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { AIRecommendationResponse, PaginatedResponse } from '@pee/types';
import { AIRecommendationsService } from './ai-recommendations.service';
import { GenerateTaskSuggestionsDto } from './dto/generate-task-suggestions.dto';

@UseGuards(JwtAuthGuard)
@Controller('goals/:goalId/ai/task-suggestions')
export class AIRecommendationsController {
  constructor(private readonly aiRecommendationsService: AIRecommendationsService) {}

  /** Tighter than the global rate limit — LLM calls are slow and cost money per request. */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  generate(
    @CurrentUser() user: CurrentUserPayload,
    @Param('goalId') goalId: string,
    @Body() dto: GenerateTaskSuggestionsDto,
  ): Promise<AIRecommendationResponse> {
    return this.aiRecommendationsService.generateTaskSuggestions(user.id, goalId, dto);
  }

  @Get()
  async list(
    @CurrentUser() user: CurrentUserPayload,
    @Param('goalId') goalId: string,
  ): Promise<PaginatedResponse<AIRecommendationResponse>> {
    const { data, total } = await this.aiRecommendationsService.listRecommendations(user.id, goalId);
    const pageSize = 20;
    return { data, page: 1, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
  }
}
