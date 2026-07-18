import { Injectable } from '@nestjs/common';
import { PrismaService, User } from '@pee/database';
import { SsoProvider, SsoProvisionResponse } from '@pee/types';
import { AuthService } from '../auth.service';

/**
 * Shared by both OIDC (`oidc/provision.controller.ts`) and the SAML bridge
 * (`saml/saml.controller.ts`) — one find-or-create/link/issue-tokens path
 * regardless of which IdP protocol authenticated the user. See adr/0009.
 */
@Injectable()
export class SsoProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async findOrCreateUser(
    provider: SsoProvider,
    providerName: string,
    providerUserId: string,
    email: string,
    displayName: string,
  ): Promise<SsoProvisionResponse> {
    const existingIdentity = await this.prisma.ssoIdentity.findUnique({
      where: { provider_providerName_providerUserId: { provider, providerName, providerUserId } },
      include: { user: true },
    });
    const user =
      existingIdentity?.user ??
      (await this.prisma.user.findUnique({ where: { email } })) ??
      (await this.authService.createUserWithPersonalOrganization(email, displayName, null));

    if (!existingIdentity) {
      await this.prisma.ssoIdentity.create({ data: { userId: user.id, provider, providerName, providerUserId } });
    }

    return this.toResponse(user);
  }

  /** `getProfile` (not a hand-picked subset) so `user` includes `organizations` — Auth.js's
   * `profile()` callback needs the full shape without a second round-trip. */
  private async toResponse(user: User): Promise<SsoProvisionResponse> {
    const [profile, tokens] = await Promise.all([
      this.authService.getProfile(user.id),
      this.authService.issueTokensForUser(user),
    ]);
    return { user: profile, tokens };
  }
}
