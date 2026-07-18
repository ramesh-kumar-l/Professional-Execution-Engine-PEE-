import { ConfigService } from '@nestjs/config';

/**
 * Auth.js runs the entire OIDC exchange itself (discovery, PKCE, state, nonce,
 * token exchange) — this backend never talks OIDC directly. This flag only
 * gates whether the provisioning endpoint below is allowed to accept calls,
 * mirroring the fail-closed posture every other optional integration uses.
 * See adr/0009.
 */
export function isOidcConfigured(config: ConfigService): boolean {
  return Boolean(config.get<string>('SSO_OIDC_ISSUER_URL'));
}
