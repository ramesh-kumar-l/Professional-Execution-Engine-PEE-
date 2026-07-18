import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { SamlIdentity } from './saml.service';

interface RelayStatePayload {
  state: string;
  redirectUri: string;
}

interface OneTimeCodePayload extends SamlIdentity {
  jti: string;
}

/**
 * Minimal OAuth2-authorization-code façade in front of the real SAML SP
 * (saml.service.ts), so Auth.js's generic `type: 'oauth'` provider can drive
 * SAML exactly like any OAuth IdP — Auth.js has no native SAML provider type.
 * Every token here is a short-lived signed JWT, not a DB row. The one-time
 * code's replay guard is an in-memory Set — a documented limitation for
 * multi-instance deployments (see 27-backlog.md). See adr/0009.
 */
@Injectable()
export class SamlBridgeService {
  private readonly redeemedCodeIds = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  encodeRelayState(payload: RelayStatePayload): string {
    return this.jwtService.sign(payload, { secret: this.secret(), expiresIn: '5m' });
  }

  decodeRelayState(relayState: string): RelayStatePayload {
    return this.verify<RelayStatePayload>(relayState);
  }

  /** Single-use — issued by the ACS handler, redeemed exactly once by the token endpoint. */
  issueOneTimeCode(identity: SamlIdentity): string {
    const payload: OneTimeCodePayload = { ...identity, jti: randomUUID() };
    return this.jwtService.sign(payload, { secret: this.secret(), expiresIn: '60s' });
  }

  redeemOneTimeCode(code: string): SamlIdentity {
    const payload = this.verify<OneTimeCodePayload>(code);
    if (this.redeemedCodeIds.has(payload.jti)) {
      throw new UnauthorizedException('SAML bridge code already redeemed');
    }
    this.redeemedCodeIds.add(payload.jti);
    return { nameId: payload.nameId, email: payload.email };
  }

  /** Not single-use — the token endpoint's response, decoded once by userinfo moments later. */
  issueAccessToken(identity: SamlIdentity): string {
    return this.jwtService.sign(identity, { secret: this.secret(), expiresIn: '60s' });
  }

  decodeAccessToken(token: string): SamlIdentity {
    return this.verify<SamlIdentity>(token);
  }

  private verify<T extends object>(token: string): T {
    try {
      return this.jwtService.verify<T>(token, { secret: this.secret() });
    } catch {
      throw new UnauthorizedException('Invalid or expired SAML bridge token');
    }
  }

  private secret(): string {
    return this.config.get<string>('SSO_SAML_BRIDGE_SECRET') ?? this.config.get<string>('JWT_ACCESS_SECRET') ?? '';
  }
}
