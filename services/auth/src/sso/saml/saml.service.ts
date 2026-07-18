import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Profile, SAML } from '@node-saml/node-saml';
import { buildSamlConfig } from './saml.config';

export interface SamlIdentity {
  nameId: string;
  email: string;
}

/**
 * A real SAML Service Provider (Phase 10) — Auth.js has no native SAML provider
 * type, so this sits behind the OAuth2-shaped façade in saml-bridge.service.ts /
 * saml.controller.ts. See adr/0009 for the full scope boundary.
 */
@Injectable()
export class SamlService {
  private readonly client: SAML | null;

  constructor(config: ConfigService) {
    const options = buildSamlConfig(config);
    this.client = options ? new SAML(options) : null;
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  async getAuthorizeUrl(relayState: string): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException('SAML SSO is not configured');
    }
    return this.client.getAuthorizeUrlAsync(relayState, undefined, {});
  }

  /**
   * Fail-closed: any parsing/signature/timing failure from node-saml is caught and mapped
   * to a generic 401 — the raw library error (which could contain XML internals) never
   * reaches a response body, and a malformed/tampered assertion never produces a fabricated
   * identity. Mirrors Phase 6's "vendor errors are mapped before they reach a response" rule.
   */
  async validateResponse(samlResponse: string, relayState: string): Promise<SamlIdentity> {
    if (!this.client) {
      throw new ServiceUnavailableException('SAML SSO is not configured');
    }
    let profile: Profile | null;
    try {
      ({ profile } = await this.client.validatePostResponseAsync({
        SAMLResponse: samlResponse,
        RelayState: relayState,
      }));
    } catch {
      throw new UnauthorizedException('SAML assertion failed validation');
    }
    const email = (profile?.email as string | undefined) ?? (profile?.mail as string | undefined) ?? profile?.nameID;
    if (!profile || !email) {
      throw new UnauthorizedException('SAML assertion did not include a usable identity');
    }
    return { nameId: profile.nameID, email };
  }
}
