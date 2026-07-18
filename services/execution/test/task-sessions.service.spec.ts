import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { TasksService } from '@pee/planning';
import { TaskSessionsService } from '../src/sessions/task-sessions.service';

describe('TaskSessionsService', () => {
  let prisma: jest.Mocked<any>;
  let tasksService: jest.Mocked<any>;
  let service: TaskSessionsService;

  const ownerId = 'owner-1';
  const taskId = 'task-1';
  const session = {
    id: 'session-1',
    taskId,
    ownerId,
    startedAt: new Date('2026-01-01T10:00:00Z'),
    endedAt: null,
    durationSeconds: null,
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
    version: 1,
  };

  beforeEach(() => {
    prisma = {
      taskExecutionSession: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    };
    tasksService = { getOne: jest.fn().mockResolvedValue({ id: taskId, ownerId }), update: jest.fn() };
    service = new TaskSessionsService(prisma as unknown as PrismaService, tasksService as unknown as TasksService);
  });

  describe('startTask', () => {
    it('creates a session and sets the task to IN_PROGRESS', async () => {
      prisma.taskExecutionSession.findFirst.mockResolvedValue(null);
      prisma.taskExecutionSession.create.mockResolvedValue(session);

      const result = await service.startTask(ownerId, taskId);

      expect(tasksService.getOne).toHaveBeenCalledWith(ownerId, taskId);
      expect(prisma.taskExecutionSession.create).toHaveBeenCalledWith({ data: { taskId, ownerId } });
      expect(tasksService.update).toHaveBeenCalledWith(ownerId, taskId, { status: 'IN_PROGRESS' });
      expect(result.endedAt).toBeNull();
    });

    it('rejects when the task already has an open session', async () => {
      prisma.taskExecutionSession.findFirst.mockResolvedValue(session);
      await expect(service.startTask(ownerId, taskId)).rejects.toThrow(ConflictException);
      expect(prisma.taskExecutionSession.create).not.toHaveBeenCalled();
      expect(tasksService.update).not.toHaveBeenCalled();
    });

    it('propagates 404 when the task is not owned by the caller', async () => {
      tasksService.getOne.mockRejectedValue(new NotFoundException('Task not found'));
      await expect(service.startTask(ownerId, taskId)).rejects.toThrow(NotFoundException);
      expect(prisma.taskExecutionSession.create).not.toHaveBeenCalled();
    });
  });

  describe('completeTask', () => {
    it('closes the open session and sets the task to DONE', async () => {
      prisma.taskExecutionSession.findFirst.mockResolvedValue(session);
      prisma.taskExecutionSession.update.mockResolvedValue({
        ...session,
        endedAt: new Date('2026-01-01T10:05:00Z'),
        durationSeconds: 300,
      });

      const result = await service.completeTask(ownerId, taskId);

      expect(prisma.taskExecutionSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: { endedAt: expect.any(Date), durationSeconds: expect.any(Number) },
      });
      expect(tasksService.update).toHaveBeenCalledWith(ownerId, taskId, { status: 'DONE' });
      expect(result.durationSeconds).toBe(300);
    });

    it('throws NotFoundException when there is no open session for the task', async () => {
      prisma.taskExecutionSession.findFirst.mockResolvedValue(null);
      await expect(service.completeTask(ownerId, taskId)).rejects.toThrow(NotFoundException);
      expect(tasksService.update).not.toHaveBeenCalled();
    });
  });
});
