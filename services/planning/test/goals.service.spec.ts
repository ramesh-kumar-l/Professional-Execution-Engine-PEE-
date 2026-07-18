import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@pee/database';
import { ProjectsService } from '@pee/projects';
import { GOAL_STATUS_CHANGED_EVENT } from '@pee/types';
import { GoalsService } from '../src/goals/goals.service';

describe('GoalsService', () => {
  let prisma: jest.Mocked<any>;
  let projectsService: jest.Mocked<any>;
  let eventEmitter: jest.Mocked<any>;
  let service: GoalsService;

  const ownerId = 'owner-1';
  const projectId = 'proj-1';
  const goal = {
    id: 'goal-1',
    projectId,
    ownerId,
    title: 'Ship v2',
    description: 'Relaunch the product',
    status: 'NOT_STARTED',
    targetDate: null,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    version: 1,
  };

  beforeEach(() => {
    prisma = {
      goal: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
      task: { count: jest.fn().mockResolvedValue(0) },
    };
    projectsService = { getOne: jest.fn().mockResolvedValue({ id: projectId, ownerId }) };
    eventEmitter = { emit: jest.fn() };
    service = new GoalsService(
      prisma as unknown as PrismaService,
      projectsService as unknown as ProjectsService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('create', () => {
    it('verifies the project is owned by the caller before creating a goal', async () => {
      prisma.goal.create.mockResolvedValue(goal);
      await service.create(ownerId, projectId, { title: goal.title, description: goal.description });
      expect(projectsService.getOne).toHaveBeenCalledWith(ownerId, projectId);
      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          id: undefined,
          projectId,
          ownerId,
          title: goal.title,
          description: goal.description,
          targetDate: undefined,
          updatedAt: undefined,
        },
      });
    });

    it('propagates 404 when the project is not owned by the caller', async () => {
      projectsService.getOne.mockRejectedValue(new NotFoundException('Project not found'));
      await expect(service.create(ownerId, projectId, { title: goal.title })).rejects.toThrow(NotFoundException);
      expect(prisma.goal.create).not.toHaveBeenCalled();
    });

    it('passes through a client-supplied id/updatedAt when given (sync push path)', async () => {
      prisma.goal.create.mockResolvedValue(goal);
      const updatedAt = new Date('2026-01-02T00:00:00Z');
      await service.create(ownerId, projectId, { title: goal.title }, { id: 'client-generated-id', updatedAt });
      expect(prisma.goal.create).toHaveBeenCalledWith({
        data: {
          id: 'client-generated-id',
          projectId,
          ownerId,
          title: goal.title,
          description: undefined,
          targetDate: undefined,
          updatedAt,
        },
      });
    });
  });

  describe('list', () => {
    it('excludes archived goals by default', async () => {
      prisma.goal.findMany.mockResolvedValue([goal]);
      prisma.goal.count.mockResolvedValue(1);

      const result = await service.list(ownerId, projectId, {});

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        where: { projectId, ownerId, status: { not: 'ARCHIVED' } },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.data).toHaveLength(1);
    });
  });

  describe('getOne', () => {
    it('returns the goal with computed progress when owned by the caller', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.task.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);

      const result = await service.getOne(ownerId, goal.id);

      expect(result.progress).toEqual({ totalTasks: 4, doneTasks: 2, percentComplete: 50 });
    });

    it('throws NotFoundException when the goal belongs to someone else', async () => {
      prisma.goal.findUnique.mockResolvedValue({ ...goal, ownerId: 'someone-else' });
      await expect(service.getOne(ownerId, goal.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('sets completedAt when status transitions to COMPLETED', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.goal.update.mockResolvedValue({ ...goal, status: 'COMPLETED' });

      await service.update(ownerId, goal.id, { status: 'COMPLETED' });

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goal.id },
        data: { status: 'COMPLETED', completedAt: expect.any(Date), version: { increment: 1 } },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(GOAL_STATUS_CHANGED_EVENT, {
        ownerId,
        goalId: goal.id,
        projectId,
        fromStatus: 'NOT_STARTED',
        toStatus: 'COMPLETED',
      });
    });

    it('does not emit when status is re-sent unchanged', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.goal.update.mockResolvedValue(goal);

      await service.update(ownerId, goal.id, { status: 'NOT_STARTED' });

      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('overrides updatedAt when passed via options (sync push path)', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.goal.update.mockResolvedValue(goal);
      const updatedAt = new Date('2026-01-03T00:00:00Z');

      await service.update(ownerId, goal.id, { title: 'Synced title' }, { updatedAt });

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goal.id },
        data: { title: 'Synced title', updatedAt, version: { increment: 1 } },
      });
    });
  });

  describe('archive', () => {
    it('is idempotent when already archived', async () => {
      prisma.goal.findUnique.mockResolvedValue({ ...goal, status: 'ARCHIVED' });
      await service.archive(ownerId, goal.id);
      expect(prisma.goal.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('archives a goal and emits a status-changed event', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      await service.archive(ownerId, goal.id);
      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goal.id },
        data: { status: 'ARCHIVED', version: { increment: 1 } },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(GOAL_STATUS_CHANGED_EVENT, {
        ownerId,
        goalId: goal.id,
        projectId,
        fromStatus: 'NOT_STARTED',
        toStatus: 'ARCHIVED',
      });
    });
  });

  describe('recalculateProgress', () => {
    it('does nothing when the goal has no tasks', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.task.count.mockResolvedValue(0);
      await service.recalculateProgress(goal.id);
      expect(prisma.goal.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('never auto-transitions an archived goal', async () => {
      prisma.goal.findUnique.mockResolvedValue({ ...goal, status: 'ARCHIVED' });
      await service.recalculateProgress(goal.id);
      expect(prisma.task.count).not.toHaveBeenCalled();
      expect(prisma.goal.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('moves to IN_PROGRESS when some but not all tasks are done', async () => {
      prisma.goal.findUnique.mockResolvedValue(goal);
      prisma.task.count.mockResolvedValueOnce(4).mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      await service.recalculateProgress(goal.id);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goal.id },
        data: { status: 'IN_PROGRESS', completedAt: null, version: { increment: 1 } },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(GOAL_STATUS_CHANGED_EVENT, {
        ownerId,
        goalId: goal.id,
        projectId,
        fromStatus: 'NOT_STARTED',
        toStatus: 'IN_PROGRESS',
      });
    });

    it('moves to COMPLETED when all tasks are done', async () => {
      prisma.goal.findUnique.mockResolvedValue({ ...goal, status: 'IN_PROGRESS' });
      prisma.task.count.mockResolvedValueOnce(3).mockResolvedValueOnce(3);

      await service.recalculateProgress(goal.id);

      expect(prisma.goal.update).toHaveBeenCalledWith({
        where: { id: goal.id },
        data: { status: 'COMPLETED', completedAt: expect.any(Date), version: { increment: 1 } },
      });
      expect(eventEmitter.emit).toHaveBeenCalledWith(GOAL_STATUS_CHANGED_EVENT, {
        ownerId,
        goalId: goal.id,
        projectId,
        fromStatus: 'IN_PROGRESS',
        toStatus: 'COMPLETED',
      });
    });

    it('does not update when the target status matches the current status', async () => {
      prisma.goal.findUnique.mockResolvedValue({ ...goal, status: 'NOT_STARTED' });
      prisma.task.count.mockResolvedValueOnce(2).mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      await service.recalculateProgress(goal.id);

      expect(prisma.goal.update).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });
  });
});
