import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService, User } from '@pee/database';
import { AuthTokens, UserProfile } from '@pee/types';
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
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash, displayName: dto.displayName },
    });

    return this.toProfile(user);
  }

  async login(dto: LoginDto, meta: RequestMeta): Promise<{ user: UserProfile; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await this.passwordService.verify(dto.password, user.passwordHash))) {
      await this.auditLog.record('LOGIN_FAILURE', user?.id ?? null, meta);
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokenPair(user);
    await this.auditLog.record('LOGIN_SUCCESS', user.id, meta);
    return { user: this.toProfile(user), tokens };
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

    const tokens = await this.issueTokenPair(existing.user);
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

  private async issueTokenPair(user: User): Promise<AuthTokens> {
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

  private toProfile(user: User): UserProfile {
    return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
  }
}
