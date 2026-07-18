import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';

/**
 * Compares parsed origins, not a string prefix — `redirectUri.startsWith(allowedOrigin)`
 * would let `https://app.example.com.evil.com/...` through when `allowedOrigin` is
 * `https://app.example.com`, a classic open-redirect bypass. Extracted as a pure
 * function so this security-critical check has a direct unit test. See adr/0009.
 */
export function assertAllowedRedirect(redirectUri: string, allowedOrigin: string | undefined): void {
  if (!allowedOrigin) {
    throw new ServiceUnavailableException('SAML SSO redirect allow-list is not configured');
  }
  let parsed: URL;
  try {
    parsed = new URL(redirectUri);
  } catch {
    throw new BadRequestException('redirect_uri is not allowed');
  }
  if (parsed.origin !== new URL(allowedOrigin).origin) {
    throw new BadRequestException('redirect_uri is not allowed');
  }
}
