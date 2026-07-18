import { PrismaService } from '@pee/database';
import { GoalsService } from '@pee/planning';
import { ExecutionEventsService } from '../src/events/execution-events.service';

describe('ExecutionEventsService', () => {
  let prisma: jest.Mocked<any>;
  let goalsService: jest.Mocked<any>;
  let service: ExecutionEventsService;

  const ownerId = 'owner-1';
  const goalId = 'goal-1';
  const taskId = 'task-1';

  beforeEach(() => {
    prisma = {
      executionEvent: { create: jest.fn(), findMany: jest.fn(), count: jest.fn() },
      taskExecutionSession: { findMany: jest.fn() },
    };
    goalsService = { getOne: jest.fn().mockResolvedValue({ id: goalId, ownerId }) };
    service = new ExecutionEventsService(prisma as unknown as PrismaService, goalsService as unknown as GoalsService);
  });

  describe('handleTaskStatusChanged', () => {
    it.each([
      ['IN_PROGRESS', 'TASK_STARTED'],
      ['DONE', 'TASK_COMPLETED'],
      ['ARCHIVED', 'TASK_ARCHIVED'],
      ['TODO', 'TASK_STATUS_CHANGED'],
    ])('maps toStatus %s to eventType %s', async (toStatus, eventType) => {
      await service.handleTaskStatusChanged({ ownerId, taskId, goalId, fromStatus: 'TODO', toStatus });

      expect(prisma.executionEvent.create).toHaveBeenCalledWith({
        data: { ownerId, taskId, goalId, eventType, fromStatus: 'TODO', toStatus },
      });
    });
  });

  describe('handleGoalStatusChanged', () => {
    it('persists a GOAL_STATUS_CHANGED event', async () => {
      await service.handleGoalStatusChanged({
        ownerId,
        goalId,
        projectId: 'proj-1',
        fromStatus: 'NOT_STARTED',
        toStatus: 'IN_PROGRESS',
      });

      expect(prisma.executionEvent.create).toHaveBeenCalledWith({
        data: {
          ownerId,
          goalId,
          eventType: 'GOAL_STATUS_CHANGED',
          fromStatus: 'NOT_STARTED',
          toStatus: 'IN_PROGRESS',
        },
      });
    });
  });

  describe('listGoalActivity', () => {
    it('verifies goal ownership before listing events', async () => {
      prisma.executionEvent.findMany.mockResolvedValue([]);
      prisma.executionEvent.count.mockResolvedValue(0);

      await service.listGoalActivity(ownerId, goalId, {});

      expect(goalsService.getOne).toHaveBeenCalledWith(ownerId, goalId);
      expect(prisma.executionEvent.findMany).toHaveBeenCalledWith({
        where: { goalId, ownerId },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });
  });

  describe('listActiveSessions', () => {
    it('returns open sessions with task/goal display data', async () => {
      prisma.taskExecutionSession.findMany.mockResolvedValue([
        {
          id: 'session-1',
          taskId,
          startedAt: new Date('2026-01-01T10:00:00Z'),
          task: { title: 'Write copy', goalId, goal: { title: 'Launch site' } },
        },
      ]);

      const result = await service.listActiveSessions(ownerId);

      expect(prisma.taskExecutionSession.findMany).toHaveBeenCalledWith({
        where: { ownerId, endedAt: null },
        orderBy: { startedAt: 'desc' },
        include: { task: { include: { goal: true } } },
      });
      expect(result).toEqual([
        {
          session: { id: 'session-1', taskId, startedAt: '2026-01-01T10:00:00.000Z', endedAt: null, durationSeconds: null },
          taskTitle: 'Write copy',
          goalId,
          goalTitle: 'Launch site',
        },
      ]);
    });
  });
});
