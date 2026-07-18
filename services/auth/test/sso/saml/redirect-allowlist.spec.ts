import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { assertAllowedRedirect } from '../../../src/sso/saml/redirect-allowlist';

describe('assertAllowedRedirect', () => {
  const allowedOrigin = 'https://app.example.com';

  it('throws ServiceUnavailableException when no allow-list is configured', () => {
    expect(() => assertAllowedRedirect('https://app.example.com/callback', undefined)).toThrow(
      ServiceUnavailableException,
    );
  });

  it('allows a redirect_uri whose origin matches exactly', () => {
    expect(() => assertAllowedRedirect('https://app.example.com/api/auth/callback/sso-saml', allowedOrigin)).not.toThrow();
  });

  it('rejects a malformed redirect_uri', () => {
    expect(() => assertAllowedRedirect('not-a-url', allowedOrigin)).toThrow(BadRequestException);
  });

  it('rejects a different scheme', () => {
    expect(() => assertAllowedRedirect('http://app.example.com/callback', allowedOrigin)).toThrow(BadRequestException);
  });

  it('rejects the classic suffix-domain open-redirect bypass (startsWith would have let this through)', () => {
    expect(() => assertAllowedRedirect('https://app.example.com.evil.com/callback', allowedOrigin)).toThrow(
      BadRequestException,
    );
  });

  it('rejects an unrelated origin entirely', () => {
    expect(() => assertAllowedRedirect('https://evil.com/callback', allowedOrigin)).toThrow(BadRequestException);
  });

  it('rejects a userinfo-based bypass attempt (https://app.example.com@evil.com)', () => {
    expect(() => assertAllowedRedirect('https://app.example.com@evil.com/callback', allowedOrigin)).toThrow(
      BadRequestException,
    );
  });
});
