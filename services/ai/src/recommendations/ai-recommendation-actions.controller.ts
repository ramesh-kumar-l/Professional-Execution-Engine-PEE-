import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, CurrentUserPayload, JwtAuthGuard } from '@pee/auth';
import { AcceptRecommendationResponse, AIRecommendationResponse } from '@pee/types';
import { AIRecommendationsService } from './ai-recommendations.service';
import { AcceptRecommendationDto } from './dto/accept-recommendation.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai/recommendations/:id')
export class AIRecommendationActionsController {
  constructor(private readonly aiRecommendationsService: AIRecommendationsService) {}

  @Post('accept')
  accept(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AcceptRecommendationDto,
  ): Promise<AcceptRecommendationResponse> {
    return this.aiRecommendationsService.accept(user.id, id, dto);
  }

  @Post('dismiss')
  dismiss(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string): Promise<AIRecommendationResponse> {
    return this.aiRecommendationsService.dismiss(user.id, id);
  }
}
