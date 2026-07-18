import { PrismaService } from '@pee/database';
import { SummaryService } from '../src/summary/summary.service';

describe('SummaryService', () => {
  let prisma: jest.Mocked<any>;
  let service: SummaryService;

  const ownerId = 'owner-1';

  beforeEach(() => {
    prisma = {
      project: { groupBy: jest.fn().mockResolvedValue([]) },
      goal: { groupBy: jest.fn().mockResolvedValue([]) },
      task: { groupBy: jest.fn().mockResolvedValue([]) },
      taskExecutionSession: { aggregate: jest.fn().mockResolvedValue({ _sum: { durationSeconds: null } }) },
      aIRecommendation: { groupBy: jest.fn().mockResolvedValue([]) },
    };
    service = new SummaryService(prisma as unknown as PrismaService);
  });

  it('scopes every query by ownerId', async () => {
    await service.getSummary(ownerId);

    expect(prisma.project.groupBy).toHaveBeenCalledWith({ by: ['status'], where: { ownerId }, _count: true });
    expect(prisma.goal.groupBy).toHaveBeenCalledWith({ by: ['status'], where: { ownerId }, _count: true });
    expect(prisma.task.groupBy).toHaveBeenCalledWith({ by: ['status'], where: { ownerId }, _count: true });
    expect(prisma.taskExecutionSession.aggregate).toHaveBeenCalledWith({
      where: { ownerId, endedAt: { not: null } },
      _sum: { durationSeconds: true },
    });
    expect(prisma.aIRecommendation.groupBy).toHaveBeenCalledWith({ by: ['status'], where: { ownerId }, _count: true });
  });

  it('maps groupBy rows into status count maps', async () => {
    prisma.project.groupBy.mockResolvedValue([
      { status: 'ACTIVE', _count: 3 },
      { status: 'ARCHIVED', _count: 1 },
    ]);
    prisma.goal.groupBy.mockResolvedValue([{ status: 'IN_PROGRESS', _count: 2 }]);
    prisma.task.groupBy.mockResolvedValue([{ status: 'DONE', _count: 5 }]);

    const result = await service.getSummary(ownerId);

    expect(result.projectsByStatus).toEqual({ ACTIVE: 3, ARCHIVED: 1 });
    expect(result.goalsByStatus).toEqual({ IN_PROGRESS: 2 });
    expect(result.tasksByStatus).toEqual({ DONE: 5 });
  });

  it('defaults total time tracked to 0 when no sessions have ended', async () => {
    const result = await service.getSummary(ownerId);

    expect(result.totalTimeTrackedSeconds).toBe(0);
  });

  it('sums durationSeconds across ended sessions', async () => {
    prisma.taskExecutionSession.aggregate.mockResolvedValue({ _sum: { durationSeconds: 3600 } });

    const result = await service.getSummary(ownerId);

    expect(result.totalTimeTrackedSeconds).toBe(3600);
  });

  it('computes acceptance rate from accepted vs. dismissed recommendations', async () => {
    prisma.aIRecommendation.groupBy.mockResolvedValue([
      { status: 'ACCEPTED', _count: 3 },
      { status: 'DISMISSED', _count: 1 },
      { status: 'PENDING', _count: 2 },
    ]);

    const result = await service.getSummary(ownerId);

    expect(result.aiRecommendations.byStatus).toEqual({ ACCEPTED: 3, DISMISSED: 1, PENDING: 2 });
    expect(result.aiRecommendations.acceptanceRate).toBe(0.75);
  });

  it('returns a null acceptance rate when nothing has been responded to yet', async () => {
    prisma.aIRecommendation.groupBy.mockResolvedValue([{ status: 'PENDING', _count: 4 }]);

    const result = await service.getSummary(ownerId);

    expect(result.aiRecommendations.acceptanceRate).toBeNull();
  });
});
