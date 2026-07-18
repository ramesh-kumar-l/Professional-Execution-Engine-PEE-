import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService, User } from '@pee/database';
import { AuthTokens, UserOrganizationSummary, UserProfile } from '@pee/types';
import { AuditLogService, RequestMeta } from './audit-log.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly auditLog: AuditLogService,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = await this.createUserWithPersonalOrganization(dto.email, dto.displayName, passwordHash);
    return this.toProfile(user);
  }

  /**
   * Creates the User and its invisible personal Organization+OWNER Membership in one
   * `$transaction` (Phase 10) — every pre-existing single-user flow keeps working
   * unchanged underneath a personal workspace. `passwordHash` is `null` for an SSO-only
   * user (Phase 10 OIDC/SAML provisioning, `sso/sso-provisioning.service.ts`), which is
   * why this is shared rather than duplicated for that path.
   *
   * Inlines the Organization/Membership inserts via raw Prisma instead of calling
   * `@pee/organizations`' `OrganizationsService` — that package's controllers need
   * `CurrentUser`/`JwtAuthGuard` from this one, so importing it here would be a
   * circular package dependency (confirmed by a runtime `require()` cycle when tried).
   * See adr/0009 and `08-backend-guidelines.md`.
   */
  async createUserWithPersonalOrganization(email: string, displayName: string, passwordHash: string | null): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email, passwordHash, displayName } });
      const organization = await tx.organization.create({
        data: { name: `${displayName}'s Workspace`, isPersonal: true },
      });
      await tx.membership.create({ data: { organizationId: organization.id, userId: created.id, role: 'OWNER' } });
      return created;
    });
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !(await this.passwordService.verify(dto.password, user.passwordHash))) {
      await this.auditLog.record('LOGIN_FAILURE', user?.id ?? null, meta);
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokensForUser(user);
    await this.auditLog.record('LOGIN_SUCCESS', user.id, meta);
    return { user: await this.toProfile(user), tokens };
  }

  async refresh(rawRefreshToken: string, meta: RequestMeta): Promise<AuthTokens> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt) {
      await this.revokeAllActiveTokens(existing.userId);
      await this.auditLog.record('TOKEN_REUSE_DETECTED', existing.userId, meta);
      throw new UnauthorizedException('Refresh token reuse detected; session revoked');
    }

    if (existing.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const tokens = await this.issueTokensForUser(existing.user);
    await this.rotateToken(existing.id, tokens);
    await this.auditLog.record('TOKEN_REFRESH', existing.userId, meta);
    return tokens;
  }

  async logout(rawRefreshToken: string, meta: RequestMeta): Promise<void> {
    const tokenHash = this.tokenService.hashToken(rawRefreshToken);
    const existing = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!existing || existing.revokedAt) {
      return;
    }

    await this.prisma.refreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    await this.auditLog.record('LOGOUT', existing.userId, meta);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.toProfile(user);
  }

  /** Public so SSO provisioning (OIDC/SAML, Phase 10) can issue the same token pair password login gets. */
  async issueTokensForUser(user: User): Promise<AuthTokens> {
    const access = this.tokenService.signAccessToken({ sub: user.id, email: user.email, role: user.role });
    const refresh = this.tokenService.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: refresh.hash, expiresAt: refresh.expiresAt },
    });

    return {
      accessToken: access.token,
      refreshToken: refresh.raw,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      refreshTokenExpiresAt: refresh.expiresAt.toISOString(),
    };
  }

  /** Links the just-issued refresh token back to the one it replaced and revokes the old one. */
  private async rotateToken(oldTokenId: string, newTokens: AuthTokens): Promise<void> {
    const newTokenHash = this.tokenService.hashToken(newTokens.refreshToken);
    const newToken = await this.prisma.refreshToken.findUniqueOrThrow({ where: { tokenHash: newTokenHash } });
    await this.prisma.refreshToken.update({
      where: { id: oldTokenId },
      data: { revokedAt: new Date(), replacedByTokenId: newToken.id },
    });
  }

  private async revokeAllActiveTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Reads Membership/Organization directly via Prisma rather than `@pee/organizations`'
   * `OrganizationsService` (see `createUserWithPersonalOrganization`'s comment on the
   * circular-package-dependency reason) — the same read-only-direct-Prisma carve-out
   * `@pee/analytics` already uses: this is a self-scoped read (the caller's own
   * memberships), no cross-user authorization decision is made from it.
   */
  private async toProfile(user: User): Promise<UserProfile> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId: user.id },
      include: { organization: true },
      orderBy: { createdAt: 'asc' },
    });
    const organizations: UserOrganizationSummary[] = memberships.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      isPersonal: membership.organization.isPersonal,
      role: membership.role,
    }));

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      organizations,
    };
  }
}
