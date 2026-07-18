import { PrismaService } from '@pee/database';
import { AuthService } from '../../src/auth.service';
import { SsoProvisioningService } from '../../src/sso/sso-provisioning.service';

describe('SsoProvisioningService', () => {
  let prisma: jest.Mocked<any>;
  let authService: jest.Mocked<AuthService>;
  let service: SsoProvisioningService;

  const tokens = {
    accessToken: 'access',
    refreshToken: 'refresh',
    accessTokenExpiresAt: '2026-01-01T00:00:00.000Z',
    refreshTokenExpiresAt: '2026-01-08T00:00:00.000Z',
  };

  function profileFor(user: { id: string; email: string; displayName: string }) {
    return { id: user.id, email: user.email, displayName: user.displayName, role: 'USER' as const, organizations: [] };
  }

  beforeEach(() => {
    prisma = {
      ssoIdentity: { findUnique: jest.fn(), create: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    authService = {
      issueTokensForUser: jest.fn().mockResolvedValue(tokens),
      createUserWithPersonalOrganization: jest.fn(),
      getProfile: jest.fn().mockImplementation(async (userId: string) => profileFor({ id: userId, email: 'unused', displayName: 'unused' })),
    } as unknown as jest.Mocked<AuthService>;
    service = new SsoProvisioningService(prisma as unknown as PrismaService, authService);
  });

  it('issues tokens for the already-linked user without creating anything new', async () => {
    const existingUser = { id: 'user-1', email: 'a@b.com', displayName: 'Ada' };
    prisma.ssoIdentity.findUnique.mockResolvedValue({ user: existingUser });
    authService.getProfile.mockResolvedValue(profileFor(existingUser));

    const result = await service.findOrCreateUser('OIDC', 'okta', 'sub-123', 'a@b.com', 'Ada');

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.ssoIdentity.create).not.toHaveBeenCalled();
    expect(authService.createUserWithPersonalOrganization).not.toHaveBeenCalled();
    expect(authService.issueTokensForUser).toHaveBeenCalledWith(existingUser);
    expect(result).toEqual({ user: profileFor(existingUser), tokens });
  });

  it('links a new identity to an existing password-based user found by email', async () => {
    prisma.ssoIdentity.findUnique.mockResolvedValue(null);
    const existingUser = { id: 'user-2', email: 'b@c.com', displayName: 'Bea' };
    prisma.user.findUnique.mockResolvedValue(existingUser);
    authService.getProfile.mockResolvedValue(profileFor(existingUser));

    const result = await service.findOrCreateUser('OIDC', 'okta', 'sub-456', 'b@c.com', 'Bea');

    expect(authService.createUserWithPersonalOrganization).not.toHaveBeenCalled();
    expect(prisma.ssoIdentity.create).toHaveBeenCalledWith({
      data: { userId: existingUser.id, provider: 'OIDC', providerName: 'okta', providerUserId: 'sub-456' },
    });
    expect(result.user).toEqual(profileFor(existingUser));
  });

  it('provisions a brand-new passwordless user + personal org when no user exists for the email', async () => {
    prisma.ssoIdentity.findUnique.mockResolvedValue(null);
    prisma.user.findUnique.mockResolvedValue(null);
    const newUser = { id: 'user-3', email: 'c@d.com', displayName: 'Cara' };
    authService.createUserWithPersonalOrganization.mockResolvedValue(newUser as any);
    authService.getProfile.mockResolvedValue(profileFor(newUser));

    const result = await service.findOrCreateUser('SAML', 'default', 'nameid-789', 'c@d.com', 'Cara');

    expect(authService.createUserWithPersonalOrganization).toHaveBeenCalledWith('c@d.com', 'Cara', null);
    expect(prisma.ssoIdentity.create).toHaveBeenCalledWith({
      data: { userId: newUser.id, provider: 'SAML', providerName: 'default', providerUserId: 'nameid-789' },
    });
    expect(result.user).toEqual(profileFor(newUser));
  });
});
