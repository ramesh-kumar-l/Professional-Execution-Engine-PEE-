import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { ProjectsService } from '../src/projects.service';

describe('ProjectsService', () => {
  let prisma: jest.Mocked<any>;
  let service: ProjectsService;

  const ownerId = 'owner-1';
  const project = {
    id: 'proj-1',
    ownerId,
    name: 'Website Relaunch',
    description: 'Rebuild the marketing site',
    status: 'ACTIVE',
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    version: 1,
  };

  beforeEach(() => {
    prisma = {
      project: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new ProjectsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a project owned by the caller', async () => {
      prisma.project.create.mockResolvedValue(project);
      const result = await service.create(ownerId, { name: project.name, description: project.description });
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          id: undefined,
          ownerId,
          name: project.name,
          description: project.description,
          updatedAt: undefined,
        },
      });
      expect(result.id).toBe(project.id);
      expect(result.ownerId).toBe(ownerId);
    });

    it('passes through a client-supplied id/updatedAt when given (sync push path)', async () => {
      prisma.project.create.mockResolvedValue(project);
      const updatedAt = new Date('2026-01-02T00:00:00Z');
      await service.create(ownerId, { name: project.name }, { id: 'client-generated-id', updatedAt });
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { id: 'client-generated-id', ownerId, name: project.name, description: undefined, updatedAt },
      });
    });
  });

  describe('list', () => {
    it('defaults to ACTIVE projects, page 1, pageSize 20', async () => {
      prisma.project.findMany.mockResolvedValue([project]);
      prisma.project.count.mockResolvedValue(1);

      const result = await service.list(ownerId, {});

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { ownerId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ data: [expect.objectContaining({ id: project.id })], page: 1, pageSize: 20, total: 1, totalPages: 1 });
    });

    it('applies status, search, and pagination filters', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      await service.list(ownerId, { page: 2, pageSize: 10, status: 'ARCHIVED', search: 'site' });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { ownerId, status: 'ARCHIVED', name: { contains: 'site', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('getOne', () => {
    it('returns the project when owned by the caller', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      const result = await service.getOne(ownerId, project.id);
      expect(result.id).toBe(project.id);
    });

    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.getOne(ownerId, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the project belongs to someone else', async () => {
      prisma.project.findUnique.mockResolvedValue({ ...project, ownerId: 'someone-else' });
      await expect(service.getOne(ownerId, project.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects updates to a project not owned by the caller', async () => {
      prisma.project.findUnique.mockResolvedValue({ ...project, ownerId: 'someone-else' });
      await expect(service.update(ownerId, project.id, { name: 'New name' })).rejects.toThrow(NotFoundException);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('updates only the provided fields', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.update.mockResolvedValue({ ...project, name: 'New name' });

      await service.update(ownerId, project.id, { name: 'New name' });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: project.id },
        data: { name: 'New name', version: { increment: 1 } },
      });
    });

    it('sets archivedAt when status transitions to ARCHIVED', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.update.mockResolvedValue({ ...project, status: 'ARCHIVED' });

      await service.update(ownerId, project.id, { status: 'ARCHIVED' });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: project.id },
        data: { status: 'ARCHIVED', archivedAt: expect.any(Date), version: { increment: 1 } },
      });
    });

    it('overrides updatedAt when passed via options (sync push path)', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.update.mockResolvedValue(project);
      const updatedAt = new Date('2026-01-03T00:00:00Z');

      await service.update(ownerId, project.id, { name: 'Synced name' }, { updatedAt });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: project.id },
        data: { name: 'Synced name', updatedAt, version: { increment: 1 } },
      });
    });
  });

  describe('archive', () => {
    it('is idempotent when already archived', async () => {
      prisma.project.findUnique.mockResolvedValue({ ...project, status: 'ARCHIVED' });
      await service.archive(ownerId, project.id);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('archives an active project', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      await service.archive(ownerId, project.id);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: project.id },
        data: { status: 'ARCHIVED', archivedAt: expect.any(Date), version: { increment: 1 } },
      });
    });

    it('throws NotFoundException when the project belongs to someone else', async () => {
      prisma.project.findUnique.mockResolvedValue({ ...project, ownerId: 'someone-else' });
      await expect(service.archive(ownerId, project.id)).rejects.toThrow(NotFoundException);
    });
  });
});
