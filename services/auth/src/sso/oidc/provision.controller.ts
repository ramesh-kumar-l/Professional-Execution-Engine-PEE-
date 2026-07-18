import { Body, Controller, Post, ServiceUnavailableException, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SsoProvisionResponse } from '@pee/types';
import { SsoProvisionGuard } from '../guards/sso-provision.guard';
import { SsoProvisioningService } from '../sso-provisioning.service';
import { isOidcConfigured } from './oidc.config';
import { OidcProvisionDto } from './dto/oidc-provision.dto';

/** Server-to-server: apps/web calls this from Auth.js's `jwt` callback after its own OIDC exchange. */
@UseGuards(SsoProvisionGuard)
@Controller('auth/sso/oidc')
export class OidcProvisionController {
  constructor(
    private readonly config: ConfigService,
    private readonly provisioningService: SsoProvisioningService,
  ) {}

  @Post('provision')
  async provision(@Body() dto: OidcProvisionDto): Promise<SsoProvisionResponse> {
    if (!isOidcConfigured(this.config)) {
      throw new ServiceUnavailableException('OIDC SSO is not configured');
    }
    return this.provisioningService.findOrCreateUser(
      'OIDC',
      dto.providerName,
      dto.providerUserId,
      dto.email,
      dto.displayName,
    );
  }
}
