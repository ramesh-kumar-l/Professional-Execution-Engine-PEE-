import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { GoalsService } from '../src/goals/goals.service';
import { TasksService } from '../src/tasks/tasks.service';

describe('TasksService', () => {
  let prisma: jest.Mocked<any>;
  let goalsService: jest.Mocked<any>;
  let service: TasksService;

  const ownerId = 'owner-1';
  const goalId = 'goal-1';
  const task = {
    id: 'task-1',
    goalId,
    ownerId,
    title: 'Write migration',
    description: null,
    status: 'TODO',
    order: 0,
    completedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    version: 1,
  };

  beforeEach(() => {
    prisma = {
      task: { create: jest.fn(), findMany: jest.fn(), count: jest.fn(), findUnique: jest.fn(), update: jest.fn() },
    };
    goalsService = { getOne: jest.fn().mockResolvedValue({ id: goalId, ownerId }), recalculateProgress: jest.fn() };
    service = new TasksService(prisma as unknown as PrismaService, goalsService as unknown as GoalsService);
  });

  describe('create', () => {
    it('verifies the goal is owned by the caller and recalculates progress', async () => {
      prisma.task.create.mockResolvedValue(task);
      await service.create(ownerId, goalId, { title: task.title });

      expect(goalsService.getOne).toHaveBeenCalledWith(ownerId, goalId);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: { goalId, ownerId, title: task.title, description: undefined, order: 0 },
      });
      expect(goalsService.recalculateProgress).toHaveBeenCalledWith(goalId);
    });

    it('propagates 404 when the goal is not owned by the caller', async () => {
      goalsService.getOne.mockRejectedValue(new NotFoundException('Goal not found'));
      await expect(service.create(ownerId, goalId, { title: task.title })).rejects.toThrow(NotFoundException);
      expect(prisma.task.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('orders by order then createdAt and excludes archived tasks by default', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      await service.list(ownerId, goalId, {});

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { goalId, ownerId, status: { not: 'ARCHIVED' } },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
        skip: 0,
        take: 20,
      });
    });
  });

  describe('update', () => {
    it('does not recalculate progress when only non-status fields change', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue({ ...task, title: 'Renamed' });

      await service.update(ownerId, task.id, { title: 'Renamed' });

      expect(prisma.task.update).toHaveBeenCalledWith({ where: { id: task.id }, data: { title: 'Renamed' } });
      expect(goalsService.recalculateProgress).not.toHaveBeenCalled();
    });

    it('sets completedAt and recalculates progress when status moves to DONE', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue({ ...task, status: 'DONE' });

      await service.update(ownerId, task.id, { status: 'DONE' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: { status: 'DONE', completedAt: expect.any(Date) },
      });
      expect(goalsService.recalculateProgress).toHaveBeenCalledWith(goalId);
    });

    it('throws NotFoundException when the task belongs to someone else', async () => {
      prisma.task.findUnique.mockResolvedValue({ ...task, ownerId: 'someone-else' });
      await expect(service.update(ownerId, task.id, { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('is idempotent when already archived', async () => {
      prisma.task.findUnique.mockResolvedValue({ ...task, status: 'ARCHIVED' });
      await service.archive(ownerId, task.id);
      expect(prisma.task.update).not.toHaveBeenCalled();
      expect(goalsService.recalculateProgress).not.toHaveBeenCalled();
    });

    it('archives a task and recalculates the parent goal', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      await service.archive(ownerId, task.id);
      expect(prisma.task.update).toHaveBeenCalledWith({ where: { id: task.id }, data: { status: 'ARCHIVED' } });
      expect(goalsService.recalculateProgress).toHaveBeenCalledWith(goalId);
    });
  });
});
