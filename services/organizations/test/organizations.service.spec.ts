import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { OrganizationsService } from '../src/organizations.service';

describe('OrganizationsService', () => {
  let prisma: jest.Mocked<any>;
  let service: OrganizationsService;

  const userId = 'user-1';
  const organizationId = 'org-1';
  const organization = {
    id: organizationId,
    name: 'Acme Inc',
    isPersonal: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    version: 1,
  };

  beforeEach(() => {
    prisma = {
      organization: { create: jest.fn(), findUniqueOrThrow: jest.fn() },
      membership: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
      $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(prisma)),
    };
    service = new OrganizationsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a non-personal organization and makes the caller its OWNER', async () => {
      prisma.organization.create.mockResolvedValue(organization);
      const result = await service.create(userId, { name: organization.name });

      expect(prisma.organization.create).toHaveBeenCalledWith({ data: { name: organization.name, isPersonal: false } });
      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: { organizationId, userId, role: 'OWNER' },
      });
      expect(result).toEqual({
        id: organizationId,
        name: organization.name,
        isPersonal: false,
        role: 'OWNER',
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      });
    });
  });

  describe('assertRole', () => {
    it('throws NotFoundException when the caller is not a member', async () => {
      prisma.membership.findUnique.mockResolvedValue(null);
      await expect(service.assertRole(userId, organizationId, 'MEMBER')).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when the caller lacks the required role', async () => {
      prisma.membership.findUnique.mockResolvedValue({ organizationId, userId, role: 'MEMBER' });
      await expect(service.assertRole(userId, organizationId, 'ADMIN')).rejects.toThrow(ForbiddenException);
    });

    it('resolves the membership when the caller has sufficient role', async () => {
      const membership = { organizationId, userId, role: 'ADMIN' };
      prisma.membership.findUnique.mockResolvedValue(membership);
      const result = await service.assertRole(userId, organizationId, 'MEMBER');
      expect(result).toBe(membership);
    });

    it('treats OWNER as satisfying an ADMIN requirement', async () => {
      prisma.membership.findUnique.mockResolvedValue({ organizationId, userId, role: 'OWNER' });
      await expect(service.assertRole(userId, organizationId, 'ADMIN')).resolves.toBeDefined();
    });
  });

  describe('getDefaultOrganizationId', () => {
    it('returns the id of the caller personal organization', async () => {
      prisma.membership.findFirst.mockResolvedValue({ organizationId });
      const result = await service.getDefaultOrganizationId(userId);
      expect(result).toBe(organizationId);
      expect(prisma.membership.findFirst).toHaveBeenCalledWith({
        where: { userId, organization: { isPersonal: true } },
        select: { organizationId: true },
      });
    });

    it('throws NotFoundException when the caller has no personal organization', async () => {
      prisma.membership.findFirst.mockResolvedValue(null);
      await expect(service.getDefaultOrganizationId(userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('listForUser / listOrganizationIdsForUser', () => {
    it('maps each membership to an OrganizationResponse carrying that membership role', async () => {
      prisma.membership.findMany.mockResolvedValue([{ role: 'OWNER', organization }]);
      const result = await service.listForUser(userId);
      expect(result).toEqual([expect.objectContaining({ id: organizationId, role: 'OWNER' })]);
    });

    it('lists just the organizationIds for use as a Prisma `in` filter', async () => {
      prisma.membership.findMany.mockResolvedValue([{ organizationId: 'org-a' }, { organizationId: 'org-b' }]);
      const result = await service.listOrganizationIdsForUser(userId);
      expect(result).toEqual(['org-a', 'org-b']);
    });
  });

  describe('getOne', () => {
    it('returns the organization with the caller role when they are a member', async () => {
      prisma.membership.findUnique.mockResolvedValue({ organizationId, userId, role: 'MEMBER' });
      prisma.organization.findUniqueOrThrow.mockResolvedValue(organization);
      const result = await service.getOne(userId, organizationId);
      expect(result.role).toBe('MEMBER');
    });

    it('throws NotFoundException when the caller is not a member', async () => {
      prisma.membership.findUnique.mockResolvedValue(null);
      await expect(service.getOne(userId, organizationId)).rejects.toThrow(NotFoundException);
    });
  });
});
