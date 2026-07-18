import { AIProviderError } from '../src/provider/ai-provider.errors';
import { AIRecommendationsService } from '../src/recommendations/ai-recommendations.service';

describe('AIRecommendationsService', () => {
  const ownerId = 'owner-1';
  const goalId = 'goal-1';
  const goal = { id: goalId, title: 'Ship v2', description: 'Launch the new version', projectId: 'proj-1' };

  let prisma: any;
  let goalsService: any;
  let tasksService: any;
  let aiProvider: any;
  let service: AIRecommendationsService;

  beforeEach(() => {
    prisma = {
      task: { findMany: jest.fn().mockResolvedValue([]) },
      aIRecommendation: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    goalsService = { getOne: jest.fn().mockResolvedValue(goal) };
    tasksService = { create: jest.fn() };
    aiProvider = { complete: jest.fn() };
    service = new AIRecommendationsService(prisma, goalsService, tasksService, aiProvider);
  });

  describe('generateTaskSuggestions', () => {
    const structured = {
      suggestions: [
        { title: 'Write tests', reason: 'Ensures quality', confidence: 0.9, alternatives: ['Skip and hotfix later'] },
        { title: 'Update docs', reason: 'Keeps onboarding smooth', confidence: 0.6, alternatives: ['Leave undocumented'] },
      ],
    };

    it('persists a PENDING recommendation with full explainability fields on success', async () => {
      aiProvider.complete.mockResolvedValue({ structured, text: '', provider: 'anthropic', model: 'claude-sonnet-5' });
      prisma.aIRecommendation.create.mockResolvedValue({
        id: 'rec-1',
        ownerId,
        goalId,
        type: 'GOAL_TASK_BREAKDOWN',
        status: 'PENDING',
        context: { goalTitle: goal.title, existingTaskTitles: [] },
        suggestions: structured.suggestions,
        provider: 'anthropic',
        model: 'claude-sonnet-5',
        createdAt: new Date('2026-07-18T00:00:00Z'),
        respondedAt: null,
      });

      const result = await service.generateTaskSuggestions(ownerId, goalId, {});

      expect(goalsService.getOne).toHaveBeenCalledWith(ownerId, goalId);
      expect(prisma.aIRecommendation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId, goalId, status: 'PENDING', provider: 'anthropic', model: 'claude-sonnet-5' }),
        }),
      );
      expect(result.status).toBe('PENDING');
      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0].reason).toBe('Ensures quality');
      expect(result.suggestions[0].confidence).toBe(0.9);
      expect(result.suggestions[0].alternatives).toEqual(['Skip and hotfix later']);
    });

    it('persists a FAILED recommendation and throws a clean error when the provider throws', async () => {
      aiProvider.complete.mockRejectedValue(new AIProviderError('down', 'NETWORK'));

      await expect(service.generateTaskSuggestions(ownerId, goalId, {})).rejects.toThrow(/temporarily unavailable/);

      expect(prisma.aIRecommendation.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
    });

    it('persists a FAILED recommendation and never fabricates a suggestion when the structured output is malformed', async () => {
      aiProvider.complete.mockResolvedValue({
        structured: { not: 'the right shape' },
        text: '',
        provider: 'anthropic',
        model: 'claude-sonnet-5',
      });

      await expect(service.generateTaskSuggestions(ownerId, goalId, {})).rejects.toThrow(/temporarily unavailable/);

      expect(prisma.aIRecommendation.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      );
    });

    it('caps suggestions at maxSuggestions', async () => {
      aiProvider.complete.mockResolvedValue({ structured, text: '', provider: 'anthropic', model: 'claude-sonnet-5' });
      prisma.aIRecommendation.create.mockImplementation(({ data }: any) =>
        Promise.resolve({ id: 'rec-1', createdAt: new Date(), respondedAt: null, ...data }),
      );

      const result = await service.generateTaskSuggestions(ownerId, goalId, { maxSuggestions: 1 });

      expect(result.suggestions).toHaveLength(1);
    });
  });

  describe('accept', () => {
    const suggestions = [
      { title: 'Write tests', reason: 'r', confidence: 0.9, alternatives: [] },
      { title: 'Update docs', reason: 'r', confidence: 0.6, alternatives: [] },
    ];
    const recommendation = {
      id: 'rec-1',
      ownerId,
      goalId,
      type: 'GOAL_TASK_BREAKDOWN',
      status: 'PENDING',
      context: {},
      suggestions,
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      createdAt: new Date(),
      respondedAt: null,
    };

    it('creates exactly the selected tasks via TasksService.create and marks the recommendation ACCEPTED', async () => {
      prisma.aIRecommendation.findUnique.mockResolvedValue(recommendation);
      tasksService.create.mockResolvedValue({ id: 'task-1', title: 'Write tests' });
      prisma.aIRecommendation.update.mockResolvedValue({ ...recommendation, status: 'ACCEPTED', respondedAt: new Date() });

      const result = await service.accept(ownerId, 'rec-1', { acceptedIndices: [0] });

      expect(tasksService.create).toHaveBeenCalledTimes(1);
      expect(tasksService.create).toHaveBeenCalledWith(ownerId, goalId, { title: 'Write tests', description: undefined });
      expect(prisma.aIRecommendation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rec-1' }, data: expect.objectContaining({ status: 'ACCEPTED' }) }),
      );
      expect(result.createdTasks).toHaveLength(1);
      expect(result.recommendation.status).toBe('ACCEPTED');
    });

    it('rejects re-accepting a non-PENDING recommendation', async () => {
      prisma.aIRecommendation.findUnique.mockResolvedValue({ ...recommendation, status: 'ACCEPTED' });

      await expect(service.accept(ownerId, 'rec-1', { acceptedIndices: [0] })).rejects.toThrow(/already accepted/);
      expect(tasksService.create).not.toHaveBeenCalled();
    });

    it('404s on a recommendation owned by another user, without leaking its existence', async () => {
      prisma.aIRecommendation.findUnique.mockResolvedValue({ ...recommendation, ownerId: 'someone-else' });

      await expect(service.accept(ownerId, 'rec-1', { acceptedIndices: [0] })).rejects.toThrow('Recommendation not found');
    });

    it('rejects an out-of-range index', async () => {
      prisma.aIRecommendation.findUnique.mockResolvedValue(recommendation);

      await expect(service.accept(ownerId, 'rec-1', { acceptedIndices: [5] })).rejects.toThrow(/out of range/);
      expect(tasksService.create).not.toHaveBeenCalled();
    });
  });

  describe('dismiss', () => {
    const recommendation = {
      id: 'rec-1',
      ownerId,
      goalId,
      type: 'GOAL_TASK_BREAKDOWN',
      status: 'PENDING',
      context: {},
      suggestions: [],
      provider: 'anthropic',
      model: 'claude-sonnet-5',
      createdAt: new Date(),
      respondedAt: null,
    };

    it('marks the recommendation DISMISSED and creates nothing', async () => {
      prisma.aIRecommendation.findUnique.mockResolvedValue(recommendation);
      prisma.aIRecommendation.update.mockResolvedValue({ ...recommendation, status: 'DISMISSED', respondedAt: new Date() });

      const result = await service.dismiss(ownerId, 'rec-1');

      expect(tasksService.create).not.toHaveBeenCalled();
      expect(result.status).toBe('DISMISSED');
    });

    it('rejects dismissing a non-PENDING recommendation', async () => {
      prisma.aIRecommendation.findUnique.mockResolvedValue({ ...recommendation, status: 'DISMISSED' });

      await expect(service.dismiss(ownerId, 'rec-1')).rejects.toThrow(/already dismissed/);
    });
  });
});
