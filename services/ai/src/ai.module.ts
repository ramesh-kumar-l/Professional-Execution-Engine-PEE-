import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PlanningModule } from '@pee/planning';
import { AI_PROVIDER_TOKEN } from './provider/ai-provider.interface';
import { createAIProvider } from './provider/ai-provider.factory';
import { AIRecommendationActionsController } from './recommendations/ai-recommendation-actions.controller';
import { AIRecommendationsController } from './recommendations/ai-recommendations.controller';
import { AIRecommendationsService } from './recommendations/ai-recommendations.service';

@Module({
  imports: [PlanningModule],
  controllers: [AIRecommendationsController, AIRecommendationActionsController],
  providers: [
    AIRecommendationsService,
    {
      provide: AI_PROVIDER_TOKEN,
      useFactory: createAIProvider,
      inject: [ConfigService],
    },
  ],
  exports: [AIRecommendationsService],
})
export class AIModule {}
