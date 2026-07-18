import { PrismaService } from '@pee/database';
import { TimeTrackingService } from '../src/time-tracking/time-tracking.service';

describe('TimeTrackingService', () => {
  let prisma: jest.Mocked<any>;
  let service: TimeTrackingService;

  const ownerId = 'owner-1';

  beforeEach(() => {
    prisma = { taskExecutionSession: { findMany: jest.fn().mockResolvedValue([]) } };
    service = new TimeTrackingService(prisma as unknown as PrismaService);
  });

  it('queries only ended sessions scoped by owner and the trailing window', async () => {
    await service.getTimeTracking(ownerId, 'goal', 30);

    expect(prisma.taskExecutionSession.findMany).toHaveBeenCalledWith({
      where: { ownerId, endedAt: { not: null }, startedAt: { gte: expect.any(Date) } },
      select: {
        durationSeconds: true,
        task: {
          select: {
            goalId: true,
            goal: { select: { title: true, projectId: true, project: { select: { name: true } } } },
          },
        },
      },
    });
  });

  it('sums durations per goal when grouping by goal', async () => {
    prisma.taskExecutionSession.findMany.mockResolvedValue([
      { durationSeconds: 100, task: { goalId: 'goal-1', goal: { title: 'Launch', projectId: 'proj-1', project: { name: 'Site' } } } },
      { durationSeconds: 200, task: { goalId: 'goal-1', goal: { title: 'Launch', projectId: 'proj-1', project: { name: 'Site' } } } },
      { durationSeconds: 50, task: { goalId: 'goal-2', goal: { title: 'Other', projectId: 'proj-1', project: { name: 'Site' } } } },
    ]);

    const result = await service.getTimeTracking(ownerId, 'goal', 30);

    expect(result).toEqual({
      groupBy: 'goal',
      entries: [
        { id: 'goal-1', title: 'Launch', totalSeconds: 300 },
        { id: 'goal-2', title: 'Other', totalSeconds: 50 },
      ],
    });
  });

  it('sums durations per project when grouping by project', async () => {
    prisma.taskExecutionSession.findMany.mockResolvedValue([
      { durationSeconds: 100, task: { goalId: 'goal-1', goal: { title: 'Launch', projectId: 'proj-1', project: { name: 'Site' } } } },
      { durationSeconds: 200, task: { goalId: 'goal-2', goal: { title: 'Other', projectId: 'proj-1', project: { name: 'Site' } } } },
    ]);

    const result = await service.getTimeTracking(ownerId, 'project', 30);

    expect(result).toEqual({ groupBy: 'project', entries: [{ id: 'proj-1', title: 'Site', totalSeconds: 300 }] });
  });

  it('treats a null durationSeconds as zero', async () => {
    prisma.taskExecutionSession.findMany.mockResolvedValue([
      { durationSeconds: null, task: { goalId: 'goal-1', goal: { title: 'Launch', projectId: 'proj-1', project: { name: 'Site' } } } },
    ]);

    const result = await service.getTimeTracking(ownerId, 'goal', 30);

    expect(result.entries).toEqual([{ id: 'goal-1', title: 'Launch', totalSeconds: 0 }]);
  });

  it('sorts entries by total time descending', async () => {
    prisma.taskExecutionSession.findMany.mockResolvedValue([
      { durationSeconds: 50, task: { goalId: 'goal-1', goal: { title: 'Small', projectId: 'proj-1', project: { name: 'Site' } } } },
      { durationSeconds: 500, task: { goalId: 'goal-2', goal: { title: 'Big', projectId: 'proj-1', project: { name: 'Site' } } } },
    ]);

    const result = await service.getTimeTracking(ownerId, 'goal', 30);

    expect(result.entries.map((entry) => entry.id)).toEqual(['goal-2', 'goal-1']);
  });
});
