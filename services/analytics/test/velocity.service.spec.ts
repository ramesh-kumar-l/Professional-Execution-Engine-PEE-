import { PrismaService } from '@pee/database';
import { VelocityService } from '../src/velocity/velocity.service';

describe('VelocityService', () => {
  let prisma: jest.Mocked<any>;
  let service: VelocityService;

  const ownerId = 'owner-1';

  beforeEach(() => {
    prisma = { executionEvent: { findMany: jest.fn().mockResolvedValue([]) } };
    service = new VelocityService(prisma as unknown as PrismaService);
  });

  it('queries events scoped by owner, completion types, and the trailing window', async () => {
    await service.getVelocity(ownerId, 7);

    expect(prisma.executionEvent.findMany).toHaveBeenCalledWith({
      where: {
        ownerId,
        createdAt: { gte: expect.any(Date) },
        OR: [{ eventType: 'TASK_COMPLETED' }, { eventType: 'GOAL_STATUS_CHANGED', toStatus: 'COMPLETED' }],
      },
      select: { eventType: true, createdAt: true },
    });
  });

  it('returns one bucket per day in the window, defaulting to zero counts', async () => {
    const result = await service.getVelocity(ownerId, 3);

    expect(result.days).toBe(3);
    expect(result.points).toHaveLength(3);
    expect(result.points.every((point) => point.tasksCompleted === 0 && point.goalsCompleted === 0)).toBe(true);
  });

  it('buckets task and goal completions into the correct day', async () => {
    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);
    prisma.executionEvent.findMany.mockResolvedValue([
      { eventType: 'TASK_COMPLETED', createdAt: today },
      { eventType: 'TASK_COMPLETED', createdAt: today },
      { eventType: 'GOAL_STATUS_CHANGED', createdAt: today },
    ]);

    const result = await service.getVelocity(ownerId, 1);

    expect(result.points).toEqual([
      { date: today.toISOString().slice(0, 10), tasksCompleted: 2, goalsCompleted: 1 },
    ]);
  });

  it('ignores events that fall outside the bucketed window', async () => {
    const outOfRange = new Date('2000-01-01T00:00:00Z');
    prisma.executionEvent.findMany.mockResolvedValue([{ eventType: 'TASK_COMPLETED', createdAt: outOfRange }]);

    const result = await service.getVelocity(ownerId, 1);

    expect(result.points[0].tasksCompleted).toBe(0);
  });
});
