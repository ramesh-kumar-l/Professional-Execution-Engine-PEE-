import { ConfigService } from '@nestjs/config';
import { SamlConfig } from '@node-saml/node-saml';

/**
 * SP-initiated only, single configured IdP, no SLO, no encrypted assertions —
 * deliberately scoped, see adr/0009. Returns null (not a throw) when unset so
 * SamlService can stay optional/feature-flagged instead of crashing at boot.
 */
export function buildSamlConfig(config: ConfigService): SamlConfig | null {
  const entryPoint = config.get<string>('SSO_SAML_ENTRY_POINT');
  const issuer = config.get<string>('SSO_SAML_ISSUER');
  const idpCert = config.get<string>('SSO_SAML_IDP_CERT');
  const callbackUrl = config.get<string>('SSO_SAML_CALLBACK_URL');
  if (!entryPoint || !issuer || !idpCert || !callbackUrl) {
    return null;
  }
  return { entryPoint, issuer, idpCert, callbackUrl, wantAssertionsSigned: true };
}
