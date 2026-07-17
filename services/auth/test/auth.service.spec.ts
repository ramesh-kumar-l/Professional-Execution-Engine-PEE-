import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@pee/database';
import { AuditLogService } from '../src/audit-log.service';
import { AuthService } from '../src/auth.service';
import { PasswordService } from '../src/password.service';
import { TokenService } from '../src/token.service';

describe('AuthService', () => {
  let prisma: jest.Mocked<any>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let auditLog: jest.Mocked<AuditLogService>;
  let service: AuthService;

  const user = {
    id: 'user-1',
    email: 'a@b.com',
    passwordHash: 'hashed',
    displayName: 'Ada',
    role: 'USER',
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn(), findUniqueOrThrow: jest.fn() },
      refreshToken: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
    };
    passwordService = { hash: jest.fn(), verify: jest.fn() } as unknown as jest.Mocked<PasswordService>;
    tokenService = {
      signAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      hashToken: jest.fn(),
      verifyAccessToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;
    auditLog = { record: jest.fn() } as unknown as jest.Mocked<AuditLogService>;

    service = new AuthService(
      prisma as unknown as PrismaService,
      passwordService,
      tokenService,
      auditLog,
    );
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      await expect(
        service.register({ email: user.email, password: 'pw', displayName: 'Ada' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('hashes the password and returns a profile without the hash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      passwordService.hash.mockResolvedValue('hashed-pw');
      prisma.user.create.mockResolvedValue(user);

      const profile = await service.register({ email: user.email, password: 'plain', displayName: 'Ada' });

      expect(passwordService.hash).toHaveBeenCalledWith('plain');
      expect(profile).toEqual({ id: user.id, email: user.email, displayName: user.displayName, role: 'USER' });
      expect(profile).not.toHaveProperty('passwordHash');
    });
  });

  describe('login', () => {
    it('records LOGIN_FAILURE and rejects when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'nobody@x.com', password: 'pw' }, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(auditLog.record).toHaveBeenCalledWith('LOGIN_FAILURE', null, {});
    });

    it('records LOGIN_FAILURE with the user id and rejects on a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwordService.verify.mockResolvedValue(false);
      await expect(service.login({ email: user.email, password: 'wrong' }, {})).rejects.toThrow(
        UnauthorizedException,
      );
      expect(auditLog.record).toHaveBeenCalledWith('LOGIN_FAILURE', user.id, {});
    });

    it('issues a token pair and records LOGIN_SUCCESS on valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(user);
      passwordService.verify.mockResolvedValue(true);
      tokenService.signAccessToken.mockReturnValue({ token: 'access', expiresAt: new Date() });
      tokenService.generateRefreshToken.mockReturnValue({ raw: 'refresh', hash: 'refresh-hash', expiresAt: new Date() });
      prisma.refreshToken.create.mockResolvedValue({});

      const result = await service.login({ email: user.email, password: 'correct' }, {});

      expect(result.tokens.accessToken).toBe('access');
      expect(result.tokens.refreshToken).toBe('refresh');
      expect(result.user.id).toBe(user.id);
      expect(auditLog.record).toHaveBeenCalledWith('LOGIN_SUCCESS', user.id, {});
    });
  });

  describe('refresh', () => {
    it('rejects an unknown refresh token', async () => {
      tokenService.hashToken.mockReturnValue('unknown-hash');
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.refresh('raw-token', {})).rejects.toThrow(UnauthorizedException);
    });

    it('revokes the whole chain and logs TOKEN_REUSE_DETECTED when a revoked token is replayed', async () => {
      tokenService.hashToken.mockReturnValue('old-hash');
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: user.id,
        revokedAt: new Date(),
        expiresAt: new Date(Date.now() + 10_000),
        user,
      });

      await expect(service.refresh('stolen-token', {})).rejects.toThrow(UnauthorizedException);
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
      expect(auditLog.record).toHaveBeenCalledWith('TOKEN_REUSE_DETECTED', user.id, {});
    });

    it('rejects an expired refresh token', async () => {
      tokenService.hashToken.mockReturnValue('old-hash');
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: user.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() - 10_000),
        user,
      });

      await expect(service.refresh('expired-token', {})).rejects.toThrow(UnauthorizedException);
    });

    it('rotates the token: issues a new pair and revokes the old one', async () => {
      tokenService.hashToken.mockImplementation((raw: string) => (raw === 'old-raw' ? 'old-hash' : 'new-hash'));
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-old',
        userId: user.id,
        revokedAt: null,
        expiresAt: new Date(Date.now() + 10_000),
        user,
      });
      tokenService.signAccessToken.mockReturnValue({ token: 'new-access', expiresAt: new Date() });
      tokenService.generateRefreshToken.mockReturnValue({
        raw: 'new-raw',
        hash: 'new-hash',
        expiresAt: new Date(),
      });
      prisma.refreshToken.create.mockResolvedValue({});
      prisma.refreshToken.findUniqueOrThrow.mockResolvedValue({ id: 'rt-new' });

      const tokens = await service.refresh('old-raw', {});

      expect(tokens.refreshToken).toBe('new-raw');
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-old' },
        data: { revokedAt: expect.any(Date), replacedByTokenId: 'rt-new' },
      });
      expect(auditLog.record).toHaveBeenCalledWith('TOKEN_REFRESH', user.id, {});
    });
  });

  describe('logout', () => {
    it('is a no-op when the token is unknown or already revoked', async () => {
      tokenService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.findUnique.mockResolvedValue(null);
      await service.logout('raw', {});
      expect(prisma.refreshToken.update).not.toHaveBeenCalled();
    });

    it('revokes an active token and records LOGOUT', async () => {
      tokenService.hashToken.mockReturnValue('hash');
      prisma.refreshToken.findUnique.mockResolvedValue({ id: 'rt-1', userId: user.id, revokedAt: null });
      await service.logout('raw', {});
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revokedAt: expect.any(Date) },
      });
      expect(auditLog.record).toHaveBeenCalledWith('LOGOUT', user.id, {});
    });
  });
});
