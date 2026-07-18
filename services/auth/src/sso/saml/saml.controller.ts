import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SsoProvisionResponse } from '@pee/types';
import type { Response } from 'express';
import { SsoProvisioningService } from '../sso-provisioning.service';
import { SamlBridgeService } from './saml-bridge.service';
import { assertAllowedRedirect } from './redirect-allowlist';
import { SamlService } from './saml.service';

/**
 * Everything here is server-to-server except `authorize`/`acs`, which the
 * browser is redirected through as part of the real SAML SP-initiated flow.
 * `token`/`userinfo` are the OAuth2-shaped endpoints Auth.js's generic
 * `type: 'oauth'` provider calls directly. See adr/0009.
 */
@Controller('auth/sso/saml')
export class SamlController {
  constructor(
    private readonly samlService: SamlService,
    private readonly bridgeService: SamlBridgeService,
    private readonly provisioningService: SsoProvisioningService,
    private readonly config: ConfigService,
  ) {}

  @Get('authorize')
  async authorize(
    @Query('state') state: string,
    @Query('redirect_uri') redirectUri: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!this.samlService.isConfigured()) {
      throw new ServiceUnavailableException('SAML SSO is not configured');
    }
    assertAllowedRedirect(redirectUri, this.config.get<string>('SSO_SAML_ALLOWED_REDIRECT_ORIGIN'));
    const relayState = this.bridgeService.encodeRelayState({ state, redirectUri });
    const url = await this.samlService.getAuthorizeUrl(relayState);
    res.redirect(url);
  }

  /** The real SAML Assertion Consumer Service endpoint — the IdP POSTs here, not Auth.js. */
  @Post('acs')
  async acs(
    @Body('SAMLResponse') samlResponse: string,
    @Body('RelayState') relayState: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!samlResponse || !relayState) {
      throw new BadRequestException('Missing SAMLResponse or RelayState');
    }
    const { state, redirectUri } = this.bridgeService.decodeRelayState(relayState);
    assertAllowedRedirect(redirectUri, this.config.get<string>('SSO_SAML_ALLOWED_REDIRECT_ORIGIN'));
    const identity = await this.samlService.validateResponse(samlResponse, relayState);
    const code = this.bridgeService.issueOneTimeCode(identity);
    const separator = redirectUri.includes('?') ? '&' : '?';
    res.redirect(`${redirectUri}${separator}code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
  }

  @Post('token')
  token(@Body('code') code: string): { access_token: string; token_type: 'bearer' } {
    if (!this.samlService.isConfigured()) {
      throw new ServiceUnavailableException('SAML SSO is not configured');
    }
    const identity = this.bridgeService.redeemOneTimeCode(code);
    return { access_token: this.bridgeService.issueAccessToken(identity), token_type: 'bearer' };
  }

  /**
   * Not a standard flat OIDC-userinfo shape — this is our own bridge, so the response is
   * the same `{ user, tokens }` shape `/auth/sso/oidc/provision` returns, letting
   * `apps/web/auth.ts`'s SAML `profile()` callback build a full session `User` (with
   * `organizations`) without a second round-trip.
   */
  @Get('userinfo')
  async userinfo(@Headers('authorization') authHeader = ''): Promise<SsoProvisionResponse> {
    if (!this.samlService.isConfigured()) {
      throw new ServiceUnavailableException('SAML SSO is not configured');
    }
    const accessToken = authHeader.replace(/^Bearer\s+/i, '');
    const identity = this.bridgeService.decodeAccessToken(accessToken);
    return this.provisioningService.findOrCreateUser('SAML', 'default', identity.nameId, identity.email, identity.email);
  }
}
