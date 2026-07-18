import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Membership, PrismaService, User } from '@pee/database';
import { MemberResponse } from '@pee/types';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { OrganizationsService } from './organizations.service';

/**
 * Admin-facing membership actions (invite/role-change/remove), split out from
 * OrganizationsService (which owns self-service reads/creation) to keep each
 * file focused. See adr/0009.
 */
@Injectable()
export class MembershipManagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async listMembers(userId: string, organizationId: string): Promise<MemberResponse[]> {
    await this.organizationsService.assertRole(userId, organizationId, 'MEMBER');
    const memberships = await this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => this.toMemberResponse(membership));
  }

  /**
   * No email-delivery/invite-token flow exists yet (same deferred-dependency precedent as
   * the "Email verification"/"Password reset" backlog entries), so this only links an
   * *existing* PEE user by email — a new signup can't be invited directly.
   */
  async inviteMember(userId: string, organizationId: string, dto: InviteMemberDto): Promise<MemberResponse> {
    await this.organizationsService.assertRole(userId, organizationId, 'ADMIN');
    const targetUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!targetUser) {
      throw new NotFoundException(
        'No existing account found for that email — invite-by-email for new signups is not yet supported',
      );
    }
    const existing = await this.organizationsService.findMembership(targetUser.id, organizationId);
    if (existing) {
      throw new ConflictException('This user is already a member of the organization');
    }
    const role = dto.role ?? 'MEMBER';
    if (role === 'OWNER') {
      await this.organizationsService.assertRole(userId, organizationId, 'OWNER');
    }
    const membership = await this.prisma.membership.create({
      data: { organizationId, userId: targetUser.id, role },
      include: { user: true },
    });
    return this.toMemberResponse(membership);
  }

  async updateMemberRole(
    userId: string,
    organizationId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
  ): Promise<MemberResponse> {
    const callerMembership = await this.organizationsService.assertRole(userId, organizationId, 'ADMIN');
    const targetMembership = await this.organizationsService.findMembership(targetUserId, organizationId);
    if (!targetMembership) {
      throw new NotFoundException('Member not found');
    }
    if ((dto.role === 'OWNER' || targetMembership.role === 'OWNER') && callerMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only an OWNER can grant or revoke the OWNER role');
    }
    if (targetMembership.role === 'OWNER' && dto.role !== 'OWNER') {
      await this.assertNotLastOwner(organizationId, targetUserId);
    }
    const updated = await this.prisma.membership.update({
      where: { id: targetMembership.id },
      data: { role: dto.role, version: { increment: 1 } },
      include: { user: true },
    });
    return this.toMemberResponse(updated);
  }

  async removeMember(userId: string, organizationId: string, targetUserId: string): Promise<void> {
    const callerMembership = await this.organizationsService.assertRole(userId, organizationId, 'ADMIN');
    const targetMembership = await this.organizationsService.findMembership(targetUserId, organizationId);
    if (!targetMembership) {
      return;
    }
    if (targetMembership.role !== 'MEMBER' && callerMembership.role !== 'OWNER') {
      throw new ForbiddenException('Only an OWNER can remove an ADMIN or OWNER');
    }
    if (targetMembership.role === 'OWNER') {
      await this.assertNotLastOwner(organizationId, targetUserId);
    }
    await this.prisma.membership.delete({ where: { id: targetMembership.id } });
  }

  private async assertNotLastOwner(organizationId: string, excludingUserId: string): Promise<void> {
    const otherOwners = await this.prisma.membership.count({
      where: { organizationId, role: 'OWNER', userId: { not: excludingUserId } },
    });
    if (otherOwners === 0) {
      throw new ConflictException('An organization must always have at least one OWNER');
    }
  }

  private toMemberResponse(membership: Membership & { user: User }): MemberResponse {
    return {
      userId: membership.userId,
      email: membership.user.email,
      displayName: membership.user.displayName,
      role: membership.role,
      createdAt: membership.createdAt.toISOString(),
    };
  }
}
