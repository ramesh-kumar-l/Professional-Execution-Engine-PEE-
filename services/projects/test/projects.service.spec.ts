import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { OrganizationsService } from '@pee/organizations';
import { ProjectsService } from '../src/projects.service';

describe('ProjectsService', () => {
  let prisma: jest.Mocked<any>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let service: ProjectsService;

  const ownerId = 'owner-1';
  const organizationId = 'org-1';
  const project = {
    id: 'proj-1',
    ownerId,
    organizationId,
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
    organizationsService = {
      assertRole: jest.fn().mockResolvedValue({ organizationId, role: 'MEMBER' }),
      getDefaultOrganizationId: jest.fn().mockResolvedValue(organizationId),
      listOrganizationIdsForUser: jest.fn().mockResolvedValue([organizationId]),
    } as unknown as jest.Mocked<OrganizationsService>;
    service = new ProjectsService(prisma as unknown as PrismaService, organizationsService);
  });

  describe('create', () => {
    it('defaults to the caller personal organization when none is given', async () => {
      prisma.project.create.mockResolvedValue(project);
      const result = await service.create(ownerId, { name: project.name, description: project.description });
      expect(organizationsService.getDefaultOrganizationId).toHaveBeenCalledWith(ownerId);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          id: undefined,
          ownerId,
          organizationId,
          name: project.name,
          description: project.description,
          updatedAt: undefined,
        },
      });
      expect(result.id).toBe(project.id);
      expect(result.organizationId).toBe(organizationId);
    });

    it('creates in the given organizationId after verifying membership', async () => {
      prisma.project.create.mockResolvedValue(project);
      await service.create(ownerId, { name: project.name, organizationId: 'org-explicit' });
      expect(organizationsService.assertRole).toHaveBeenCalledWith(ownerId, 'org-explicit', 'MEMBER');
      expect(organizationsService.getDefaultOrganizationId).not.toHaveBeenCalled();
    });

    it('passes through a client-supplied id/updatedAt when given (sync push path)', async () => {
      prisma.project.create.mockResolvedValue(project);
      const updatedAt = new Date('2026-01-02T00:00:00Z');
      await service.create(ownerId, { name: project.name }, { id: 'client-generated-id', updatedAt });
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          id: 'client-generated-id',
          ownerId,
          organizationId,
          name: project.name,
          description: undefined,
          updatedAt,
        },
      });
    });
  });

  describe('list', () => {
    it('defaults to every organization the caller belongs to when none is given', async () => {
      prisma.project.findMany.mockResolvedValue([project]);
      prisma.project.count.mockResolvedValue(1);

      const result = await service.list(ownerId, {});

      expect(organizationsService.listOrganizationIdsForUser).toHaveBeenCalledWith(ownerId);
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: { in: [organizationId] }, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({
        data: [expect.objectContaining({ id: project.id })],
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it('scopes to a single organizationId after verifying membership', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      await service.list(ownerId, { organizationId: 'org-explicit' });

      expect(organizationsService.assertRole).toHaveBeenCalledWith(ownerId, 'org-explicit', 'MEMBER');
      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: 'org-explicit', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('applies status, search, and pagination filters', async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      await service.list(ownerId, { page: 2, pageSize: 10, status: 'ARCHIVED', search: 'site' });

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { organizationId: { in: [organizationId] }, status: 'ARCHIVED', name: { contains: 'site', mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 10,
      });
    });
  });

  describe('getOne', () => {
    it('returns the project when the caller is a member of its organization', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      const result = await service.getOne(ownerId, project.id);
      expect(result.id).toBe(project.id);
    });

    it('throws NotFoundException when the project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(service.getOne(ownerId, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the caller is not a member of the organization', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      organizationsService.assertRole.mockRejectedValue(new NotFoundException('Organization not found'));
      await expect(service.getOne(ownerId, project.id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects updates when the caller is not a member of the organization', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      organizationsService.assertRole.mockRejectedValue(new NotFoundException('Organization not found'));
      await expect(service.update(ownerId, project.id, { name: 'New name' })).rejects.toThrow(NotFoundException);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('allows any org member (not just the creator) to update', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      prisma.project.update.mockResolvedValue({ ...project, name: 'New name' });

      await service.update('teammate-2', project.id, { name: 'New name' });

      expect(organizationsService.assertRole).toHaveBeenCalledWith('teammate-2', organizationId, 'MEMBER');
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

    it('lets the creator archive without an extra role check', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      await service.archive(ownerId, project.id);
      expect(organizationsService.assertRole).toHaveBeenCalledTimes(1); // only the accessibility (MEMBER) check
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: project.id },
        data: { status: 'ARCHIVED', archivedAt: expect.any(Date), version: { increment: 1 } },
      });
    });

    it('rejects archiving by a plain MEMBER who is not the creator', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      organizationsService.assertRole
        .mockResolvedValueOnce({ organizationId, role: 'MEMBER' } as any) // accessibility check
        .mockRejectedValueOnce(new ForbiddenException('Insufficient role for this action')); // destructive check

      await expect(service.archive('teammate-2', project.id)).rejects.toThrow(ForbiddenException);
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('lets an org ADMIN archive a project they did not create', async () => {
      prisma.project.findUnique.mockResolvedValue(project);
      organizationsService.assertRole
        .mockResolvedValueOnce({ organizationId, role: 'ADMIN' } as any)
        .mockResolvedValueOnce({ organizationId, role: 'ADMIN' } as any);

      await service.archive('admin-2', project.id);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: project.id },
        data: { status: 'ARCHIVED', archivedAt: expect.any(Date), version: { increment: 1 } },
      });
    });
  });
});
