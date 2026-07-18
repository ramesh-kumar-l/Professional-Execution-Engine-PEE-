import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Membership, Organization, PrismaService } from '@pee/database';
import { MembershipRole, OrganizationResponse } from '@pee/types';
import { CreateOrganizationDto } from './dto/create-organization.dto';

const ROLE_RANK: Record<MembershipRole, number> = { MEMBER: 0, ADMIN: 1, OWNER: 2 };

/**
 * Owns Organization/Membership (Phase 10 — Enterprise). Resources stay
 * resource-scoped, not session-scoped: there is no stateful "active
 * organization" concept anywhere in this service. See adr/0009.
 *
 * Deliberately not imported by `@pee/auth`: this module's controllers need
 * `CurrentUser`/`JwtAuthGuard` from `@pee/auth`, so an `@pee/auth` → here
 * import would be a circular package dependency (a real Node.js CommonJS
 * require() cycle, not just a Nest DI-graph one — confirmed by a runtime
 * `TypeError` when it was tried). `AuthService` reads `Membership`/`Organization`
 * directly via Prisma instead (the same read-only-direct-Prisma carve-out
 * `@pee/analytics` already uses), and creates the personal org+membership at
 * registration with its own small, deliberately duplicated insert — see
 * `AuthService.createUserWithPersonalOrganization`.
 */
@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates a real (non-personal) organization; the caller becomes its OWNER. */
  async create(userId: string, dto: CreateOrganizationDto): Promise<OrganizationResponse> {
    const organization = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name: dto.name, isPersonal: false } });
      await tx.membership.create({ data: { organizationId: org.id, userId, role: 'OWNER' } });
      return org;
    });
    return this.toResponse(organization, 'OWNER');
  }

  async getOne(userId: string, id: string): Promise<OrganizationResponse> {
    const membership = await this.assertRole(userId, id, 'MEMBER');
    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id } });
    return this.toResponse(organization, membership.role);
  }

  async listForUser(userId: string): Promise<OrganizationResponse[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships.map((membership) => this.toResponse(membership.organization, membership.role));
  }

  async listOrganizationIdsForUser(userId: string): Promise<string[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    return memberships.map((membership) => membership.organizationId);
  }

  async getDefaultOrganizationId(userId: string): Promise<string> {
    const membership = await this.prisma.membership.findFirst({
      where: { userId, organization: { isPersonal: true } },
      select: { organizationId: true },
    });
    if (!membership) {
      throw new NotFoundException('No personal organization found for this user');
    }
    return membership.organizationId;
  }

  async findMembership(userId: string, organizationId: string): Promise<Membership | null> {
    return this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
  }

  /**
   * Not-a-member stays 404 (same existence-hiding discipline as every other module's
   * ownership check). Member-but-insufficient-role is 403 — a deliberate, narrow exception
   * to the blanket 404-not-403 rule: being a member of an org you can already see doesn't
   * newly disclose anything. See adr/0009.
   */
  async assertRole(userId: string, organizationId: string, minRole: MembershipRole): Promise<Membership> {
    const membership = await this.findMembership(userId, organizationId);
    if (!membership) {
      throw new NotFoundException('Organization not found');
    }
    if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) {
      throw new ForbiddenException('Insufficient role for this action');
    }
    return membership;
  }

  private toResponse(organization: Organization, role: MembershipRole): OrganizationResponse {
    return {
      id: organization.id,
      name: organization.name,
      isPersonal: organization.isPersonal,
      role,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }
}
