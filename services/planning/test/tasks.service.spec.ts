import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@pee/database';
import { OrganizationsService } from '@pee/organizations';
import { TASK_STATUS_CHANGED_EVENT } from '@pee/types';
import { GoalsService } from '../src/goals/goals.service';
import { TasksService } from '../src/tasks/tasks.service';

describe('TasksService', () => {
  let prisma: jest.Mocked<any>;
  let goalsService: jest.Mocked<any>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let eventEmitter: jest.Mocked<any>;
  let service: TasksService;

  const ownerId = 'owner-1';
  const goalId = 'goal-1';
  const organizationId = 'org-1';
  const task = {
    id: 'task-1',
    goalId,
    ownerId,
    organizationId,
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
    goalsService = {
      getOne: jest.fn().mockResolvedValue({ id: goalId, ownerId, organizationId }),
      recalculateProgress: jest.fn(),
    };
    organizationsService = {
      assertRole: jest.fn().mockResolvedValue({ organizationId, role: 'MEMBER' }),
    } as unknown as jest.Mocked<OrganizationsService>;
    eventEmitter = { emit: jest.fn() };
    service = new TasksService(
      prisma as unknown as PrismaService,
      goalsService as unknown as GoalsService,
      organizationsService,
      eventEmitter as unknown as EventEmitter2,
    );
  });

  describe('create', () => {
    it('verifies the goal is accessible, inherits its organizationId, and recalculates progress', async () => {
      prisma.task.create.mockResolvedValue(task);
      await service.create(ownerId, goalId, { title: task.title });

      expect(goalsService.getOne).toHaveBeenCalledWith(ownerId, goalId);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          id: undefined,
          goalId,
          ownerId,
          organizationId,
          title: task.title,
          description: undefined,
          order: 0,
          updatedAt: undefined,
        },
      });
      expect(goalsService.recalculateProgress).toHaveBeenCalledWith(goalId);
      expect(eventEmitter.emit).toHaveBeenCalledWith(TASK_STATUS_CHANGED_EVENT, {
        ownerId,
        taskId: task.id,
        goalId,
        fromStatus: null,
        toStatus: 'TODO',
      });
    });

    it('propagates 404 when the goal is not accessible to the caller', async () => {
      goalsService.getOne.mockRejectedValue(new NotFoundException('Goal not found'));
      await expect(service.create(ownerId, goalId, { title: task.title })).rejects.toThrow(NotFoundException);
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it('passes through a client-supplied id/updatedAt when given (sync push path)', async () => {
      prisma.task.create.mockResolvedValue(task);
      const updatedAt = new Date('2026-01-02T00:00:00Z');
      await service.create(ownerId, goalId, { title: task.title }, { id: 'client-generated-id', updatedAt });
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          id: 'client-generated-id',
          goalId,
          ownerId,
          organizationId,
          title: task.title,
          description: undefined,
          order: 0,
          updatedAt,
        },
      });
    });
  });

  describe('list', () => {
    it('orders by order then createdAt, excludes archived tasks, and shows every task under the goal', async () => {
      prisma.task.findMany.mockResolvedValue([task]);
      prisma.task.count.mockResolvedValue(1);

      await service.list(ownerId, goalId, {});

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: { goalId, status: { not: 'ARCHIVED' } },
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

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: { title: 'Renamed', version: { increment: 1 } },
      });
      expect(goalsService.recalculateProgress).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('allows any org member (not just the creator) to update', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue(task);

      await service.update('teammate-2', task.id, { title: 'Renamed' });

      expect(organizationsService.assertRole).toHaveBeenCalledWith('teammate-2', organizationId, 'MEMBER');
    });

    it('overrides updatedAt when passed via options (sync push path)', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue(task);
      const updatedAt = new Date('2026-01-03T00:00:00Z');

      await service.update(ownerId, task.id, { title: 'Synced title' }, { updatedAt });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: { title: 'Synced title', updatedAt, version: { increment: 1 } },
      });
    });

    it('does not recalculate or emit when status is re-sent unchanged', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue(task);

      await service.update(ownerId, task.id, { status: 'TODO' });

      expect(goalsService.recalculateProgress).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('sets completedAt and recalculates progress when status moves to DONE', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue({ ...task, status: 'DONE' });

      await service.update(ownerId, task.id, { status: 'DONE' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: { status: 'DONE', completedAt: expect.any(Date), version: { increment: 1 } },
      });
      expect(goalsService.recalculateProgress).toHaveBeenCalledWith(goalId);
      expect(eventEmitter.emit).toHaveBeenCalledWith(TASK_STATUS_CHANGED_EVENT, {
        ownerId,
        taskId: task.id,
        goalId,
        fromStatus: 'TODO',
        toStatus: 'DONE',
      });
    });

    it('throws NotFoundException when the caller is not a member of the organization', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      organizationsService.assertRole.mockRejectedValue(new NotFoundException('Organization not found'));
      await expect(service.update(ownerId, task.id, { title: 'x' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('is idempotent when already archived', async () => {
      prisma.task.findUnique.mockResolvedValue({ ...task, status: 'ARCHIVED' });
      await service.archive(ownerId, task.id);
      expect(prisma.task.update).not.toHaveBeenCalled();
      expect(goalsService.recalculateProgress).not.toHaveBeenCalled();
      expect(eventEmitter.emit).not.toHaveBeenCalled();
    });

    it('archives a task and recalculates the parent goal when the caller is the creator', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      await service.archive(ownerId, task.id);
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: task.id },
        data: { status: 'ARCHIVED', version: { increment: 1 } },
      });
      expect(goalsService.recalculateProgress).toHaveBeenCalledWith(goalId);
      expect(eventEmitter.emit).toHaveBeenCalledWith(TASK_STATUS_CHANGED_EVENT, {
        ownerId,
        taskId: task.id,
        goalId,
        fromStatus: 'TODO',
        toStatus: 'ARCHIVED',
      });
    });

    it('rejects archiving by a plain MEMBER who is not the creator', async () => {
      prisma.task.findUnique.mockResolvedValue(task);
      organizationsService.assertRole
        .mockResolvedValueOnce({ organizationId, role: 'MEMBER' } as any)
        .mockRejectedValueOnce(new ForbiddenException('Insufficient role for this action'));

      await expect(service.archive('teammate-2', task.id)).rejects.toThrow(ForbiddenException);
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });
});
