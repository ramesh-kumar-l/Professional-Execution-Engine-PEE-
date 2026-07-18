import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SsoStatusResponse } from '@pee/types';

/** Public — apps/web's login page reads this to decide which SSO buttons to render. */
@Controller('auth/sso')
export class SsoStatusController {
  constructor(private readonly config: ConfigService) {}

  @Get('status')
  status(): SsoStatusResponse {
    return {
      oidc: Boolean(this.config.get<string>('SSO_OIDC_ISSUER_URL')),
      saml: Boolean(this.config.get<string>('SSO_SAML_ENTRY_POINT')),
    };
  }
}
