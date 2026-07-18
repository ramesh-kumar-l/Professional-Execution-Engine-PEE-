import { ConflictException, Inject, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { AIRecommendation, Prisma, PrismaService } from '@pee/database';
import { GoalsService, TasksService } from '@pee/planning';
import {
  AcceptRecommendationResponse,
  AIRecommendationContext,
  AIRecommendationResponse,
  AITaskSuggestion,
} from '@pee/types';
import { AIProvider } from '../provider/ai-provider.interface';
import { AI_PROVIDER_TOKEN } from '../provider/ai-provider.interface';
import { AIProviderError } from '../provider/ai-provider.errors';
import { AcceptRecommendationDto } from './dto/accept-recommendation.dto';
import { GenerateTaskSuggestionsDto } from './dto/generate-task-suggestions.dto';
import { buildTaskBreakdownContext, buildTaskBreakdownPrompt, TASK_BREAKDOWN_RESPONSE_SCHEMA } from './task-breakdown-prompt';

@Injectable()
export class AIRecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goalsService: GoalsService,
    private readonly tasksService: TasksService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AIProvider,
  ) {}

  /**
   * Generates suggestions and persists them as `PENDING` — nothing is written to `Task` here.
   * Human approval (`accept`) is a structural gate, not a UI convention (Principle 4).
   */
  async generateTaskSuggestions(
    ownerId: string,
    goalId: string,
    dto: GenerateTaskSuggestionsDto,
  ): Promise<AIRecommendationResponse> {
    const goal = await this.goalsService.getOne(ownerId, goalId);
    const existingTasks = await this.prisma.task.findMany({
      where: { goalId, ownerId, status: { not: 'ARCHIVED' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { title: true },
    });
    const context = buildTaskBreakdownContext(goal, existingTasks.map((task) => task.title));
    const maxSuggestions = dto.maxSuggestions ?? 5;

    try {
      const { systemPrompt, userPrompt } = buildTaskBreakdownPrompt(context, maxSuggestions);
      const result = await this.aiProvider.complete({
        systemPrompt,
        userPrompt,
        responseSchema: TASK_BREAKDOWN_RESPONSE_SCHEMA,
        maxTokens: 2048,
      });
      const suggestions = this.parseSuggestions(result.structured, maxSuggestions);

      const recommendation = await this.prisma.aIRecommendation.create({
        data: {
          ownerId,
          goalId,
          type: 'GOAL_TASK_BREAKDOWN',
          status: 'PENDING',
          context: context as unknown as Prisma.InputJsonValue,
          suggestions: suggestions as unknown as Prisma.InputJsonValue,
          provider: result.provider,
          model: result.model,
        },
      });
      return this.toResponse(recommendation);
    } catch (err) {
      // Never fabricate or partially return a suggestion — persist the failed attempt for
      // traceability, then surface a clean error. A bad AI output degrades to a safe default.
      await this.prisma.aIRecommendation.create({
        data: {
          ownerId,
          goalId,
          type: 'GOAL_TASK_BREAKDOWN',
          status: 'FAILED',
          context: context as unknown as Prisma.InputJsonValue,
          suggestions: [] as unknown as Prisma.InputJsonValue,
          provider: 'unknown',
          model: 'unknown',
          respondedAt: new Date(),
        },
      });
      const reason = err instanceof AIProviderError ? err.reason : 'UNKNOWN';
      throw new ServiceUnavailableException(
        `AI suggestions are temporarily unavailable (${reason}) — please try again.`,
      );
    }
  }

  async listRecommendations(
    ownerId: string,
    goalId: string,
  ): Promise<{ data: AIRecommendationResponse[]; total: number }> {
    await this.goalsService.getOne(ownerId, goalId);
    const [data, total] = await Promise.all([
      this.prisma.aIRecommendation.findMany({
        where: { ownerId, goalId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.aIRecommendation.count({ where: { ownerId, goalId } }),
    ]);
    return { data: data.map((recommendation) => this.toResponse(recommendation)), total };
  }

  async accept(ownerId: string, id: string, dto: AcceptRecommendationDto): Promise<AcceptRecommendationResponse> {
    const recommendation = await this.findOwnedOrThrow(ownerId, id);
    if (recommendation.status !== 'PENDING') {
      throw new ConflictException(`Recommendation already ${recommendation.status.toLowerCase()}`);
    }

    const suggestions = recommendation.suggestions as unknown as AITaskSuggestion[];
    const invalidIndex = dto.acceptedIndices.find((index) => index < 0 || index >= suggestions.length);
    if (invalidIndex !== undefined) {
      throw new ConflictException(`Suggestion index ${invalidIndex} is out of range`);
    }

    const createdTasks = [];
    for (const index of dto.acceptedIndices) {
      const suggestion = suggestions[index];
      createdTasks.push(
        await this.tasksService.create(ownerId, recommendation.goalId, {
          title: suggestion.title,
          description: suggestion.description,
        }),
      );
    }

    const updated = await this.prisma.aIRecommendation.update({
      where: { id },
      data: { status: 'ACCEPTED', respondedAt: new Date(), version: { increment: 1 } },
    });

    return { recommendation: this.toResponse(updated), createdTasks };
  }

  async dismiss(ownerId: string, id: string): Promise<AIRecommendationResponse> {
    const recommendation = await this.findOwnedOrThrow(ownerId, id);
    if (recommendation.status !== 'PENDING') {
      throw new ConflictException(`Recommendation already ${recommendation.status.toLowerCase()}`);
    }
    const updated = await this.prisma.aIRecommendation.update({
      where: { id },
      data: { status: 'DISMISSED', respondedAt: new Date(), version: { increment: 1 } },
    });
    return this.toResponse(updated);
  }

  private parseSuggestions(structured: unknown, maxSuggestions: number): AITaskSuggestion[] {
    if (
      !structured ||
      typeof structured !== 'object' ||
      !Array.isArray((structured as { suggestions?: unknown }).suggestions)
    ) {
      throw new AIProviderError('AI response did not match the expected suggestions shape', 'INVALID_RESPONSE');
    }

    const raw = (structured as { suggestions: unknown[] }).suggestions.slice(0, maxSuggestions);
    const suggestions = raw.map((item, index) => this.parseSuggestion(item, index));

    if (suggestions.length === 0) {
      throw new AIProviderError('AI returned zero suggestions', 'INVALID_RESPONSE');
    }
    return suggestions;
  }

  private parseSuggestion(item: unknown, index: number): AITaskSuggestion {
    if (typeof item !== 'object' || item === null) {
      throw new AIProviderError(`AI suggestion at index ${index} was malformed`, 'INVALID_RESPONSE');
    }
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.title !== 'string' ||
      typeof candidate.reason !== 'string' ||
      typeof candidate.confidence !== 'number' ||
      !Array.isArray(candidate.alternatives)
    ) {
      throw new AIProviderError(`AI suggestion at index ${index} was malformed`, 'INVALID_RESPONSE');
    }
    return {
      title: candidate.title,
      description: typeof candidate.description === 'string' ? candidate.description : undefined,
      reason: candidate.reason,
      confidence: Math.max(0, Math.min(1, candidate.confidence)),
      alternatives: candidate.alternatives.filter((entry): entry is string => typeof entry === 'string'),
    };
  }

  private async findOwnedOrThrow(ownerId: string, id: string): Promise<AIRecommendation> {
    const recommendation = await this.prisma.aIRecommendation.findUnique({ where: { id } });
    if (!recommendation || recommendation.ownerId !== ownerId) {
      throw new NotFoundException('Recommendation not found');
    }
    return recommendation;
  }

  private toResponse(recommendation: AIRecommendation): AIRecommendationResponse {
    return {
      id: recommendation.id,
      goalId: recommendation.goalId,
      type: recommendation.type,
      status: recommendation.status,
      suggestions: recommendation.suggestions as unknown as AITaskSuggestion[],
      context: recommendation.context as unknown as AIRecommendationContext,
      provider: recommendation.provider as AIRecommendationResponse['provider'],
      model: recommendation.model,
      createdAt: recommendation.createdAt.toISOString(),
      respondedAt: recommendation.respondedAt ? recommendation.respondedAt.toISOString() : null,
    };
  }
}
