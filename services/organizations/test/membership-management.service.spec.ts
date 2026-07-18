import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { MembershipManagementService } from '../src/membership-management.service';
import { OrganizationsService } from '../src/organizations.service';

describe('MembershipManagementService', () => {
  let prisma: jest.Mocked<any>;
  let organizationsService: jest.Mocked<OrganizationsService>;
  let service: MembershipManagementService;

  const callerId = 'caller-1';
  const organizationId = 'org-1';
  const targetUser = { id: 'target-1', email: 'target@example.com', displayName: 'Target User' };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      membership: { create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn(), findMany: jest.fn() },
    };
    organizationsService = {
      assertRole: jest.fn().mockResolvedValue({ organizationId, role: 'ADMIN' }),
      findMembership: jest.fn(),
    } as unknown as jest.Mocked<OrganizationsService>;
    service = new MembershipManagementService(prisma as unknown as PrismaService, organizationsService);
  });

  describe('listMembers', () => {
    it('requires at least MEMBER role and maps membership rows to MemberResponse', async () => {
      prisma.membership.findMany.mockResolvedValue([
        { userId: targetUser.id, role: 'MEMBER', createdAt: new Date('2026-01-01T00:00:00Z'), user: targetUser },
      ]);
      const result = await service.listMembers(callerId, organizationId);
      expect(organizationsService.assertRole).toHaveBeenCalledWith(callerId, organizationId, 'MEMBER');
      expect(result).toEqual([
        { userId: targetUser.id, email: targetUser.email, displayName: targetUser.displayName, role: 'MEMBER', createdAt: '2026-01-01T00:00:00.000Z' },
      ]);
    });
  });

  describe('inviteMember', () => {
    it('rejects when no user exists for the given email (no email-invite-token flow yet)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.inviteMember(callerId, organizationId, { email: 'nobody@x.com' })).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.membership.create).not.toHaveBeenCalled();
    });

    it('rejects when the user is already a member', async () => {
      prisma.user.findUnique.mockResolvedValue(targetUser);
      organizationsService.findMembership.mockResolvedValue({ organizationId, userId: targetUser.id, role: 'MEMBER' } as any);
      await expect(service.inviteMember(callerId, organizationId, { email: targetUser.email })).rejects.toThrow(
        ConflictException,
      );
    });

    it('defaults the new membership to MEMBER when no role is given', async () => {
      prisma.user.findUnique.mockResolvedValue(targetUser);
      organizationsService.findMembership.mockResolvedValue(null);
      prisma.membership.create.mockResolvedValue({ userId: targetUser.id, role: 'MEMBER', createdAt: new Date(), user: targetUser });

      await service.inviteMember(callerId, organizationId, { email: targetUser.email });

      expect(prisma.membership.create).toHaveBeenCalledWith({
        data: { organizationId, userId: targetUser.id, role: 'MEMBER' },
        include: { user: true },
      });
    });

    it('requires the caller to be OWNER (not just ADMIN) to invite as OWNER', async () => {
      prisma.user.findUnique.mockResolvedValue(targetUser);
      organizationsService.findMembership.mockResolvedValue(null);
      organizationsService.assertRole
        .mockResolvedValueOnce({ organizationId, role: 'ADMIN' } as any) // the initial ADMIN gate
        .mockRejectedValueOnce(new ForbiddenException('Insufficient role for this action')); // the OWNER-specific re-check

      await expect(
        service.inviteMember(callerId, organizationId, { email: targetUser.email, role: 'OWNER' }),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.membership.create).not.toHaveBeenCalled();
    });
  });

  describe('updateMemberRole', () => {
    it('throws NotFoundException when the target is not a member', async () => {
      organizationsService.findMembership.mockResolvedValue(null);
      await expect(
        service.updateMemberRole(callerId, organizationId, targetUser.id, { role: 'ADMIN' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a non-OWNER caller granting the OWNER role', async () => {
      organizationsService.assertRole.mockResolvedValue({ organizationId, role: 'ADMIN' } as any);
      organizationsService.findMembership.mockResolvedValue({ organizationId, userId: targetUser.id, role: 'MEMBER' } as any);
      await expect(
        service.updateMemberRole(callerId, organizationId, targetUser.id, { role: 'OWNER' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects demoting the organization last OWNER', async () => {
      organizationsService.assertRole.mockResolvedValue({ organizationId, role: 'OWNER' } as any);
      organizationsService.findMembership.mockResolvedValue({ id: 'm-1', organizationId, userId: targetUser.id, role: 'OWNER' } as any);
      prisma.membership.count.mockResolvedValue(0);

      await expect(
        service.updateMemberRole(callerId, organizationId, targetUser.id, { role: 'MEMBER' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.membership.update).not.toHaveBeenCalled();
    });

    it('updates the role when permitted', async () => {
      organizationsService.assertRole.mockResolvedValue({ organizationId, role: 'OWNER' } as any);
      organizationsService.findMembership.mockResolvedValue({ id: 'm-1', organizationId, userId: targetUser.id, role: 'MEMBER' } as any);
      prisma.membership.update.mockResolvedValue({ userId: targetUser.id, role: 'ADMIN', createdAt: new Date(), user: targetUser });

      await service.updateMemberRole(callerId, organizationId, targetUser.id, { role: 'ADMIN' });

      expect(prisma.membership.update).toHaveBeenCalledWith({
        where: { id: 'm-1' },
        data: { role: 'ADMIN', version: { increment: 1 } },
        include: { user: true },
      });
    });
  });

  describe('removeMember', () => {
    it('is idempotent when the target is not a member', async () => {
      organizationsService.findMembership.mockResolvedValue(null);
      await service.removeMember(callerId, organizationId, targetUser.id);
      expect(prisma.membership.delete).not.toHaveBeenCalled();
    });

    it('rejects a non-OWNER ADMIN removing another ADMIN', async () => {
      organizationsService.assertRole.mockResolvedValue({ organizationId, role: 'ADMIN' } as any);
      organizationsService.findMembership.mockResolvedValue({ id: 'm-1', organizationId, userId: targetUser.id, role: 'ADMIN' } as any);

      await expect(service.removeMember(callerId, organizationId, targetUser.id)).rejects.toThrow(ForbiddenException);
      expect(prisma.membership.delete).not.toHaveBeenCalled();
    });

    it('rejects removing the last OWNER', async () => {
      organizationsService.assertRole.mockResolvedValue({ organizationId, role: 'OWNER' } as any);
      organizationsService.findMembership.mockResolvedValue({ id: 'm-1', organizationId, userId: targetUser.id, role: 'OWNER' } as any);
      prisma.membership.count.mockResolvedValue(0);

      await expect(service.removeMember(callerId, organizationId, targetUser.id)).rejects.toThrow(ConflictException);
    });

    it('removes a plain MEMBER when the caller is ADMIN', async () => {
      organizationsService.assertRole.mockResolvedValue({ organizationId, role: 'ADMIN' } as any);
      organizationsService.findMembership.mockResolvedValue({ id: 'm-1', organizationId, userId: targetUser.id, role: 'MEMBER' } as any);

      await service.removeMember(callerId, organizationId, targetUser.id);

      expect(prisma.membership.delete).toHaveBeenCalledWith({ where: { id: 'm-1' } });
    });
  });
});
