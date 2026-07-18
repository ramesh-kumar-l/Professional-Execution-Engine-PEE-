import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SamlService } from '../../../src/sso/saml/saml.service';

const FAKE_CERT = [
  '-----BEGIN CERTIFICATE-----',
  'MIIBozCCAQwCCQCwHhSCu8V0mzANBgkqhkiG9w0BAQUFADAaMRgwFgYDVQQDEw9m',
  'YWtlLWlkcC5sb2NhbDAeFw0yNjAxMDEwMDAwMDBaFw0zNjAxMDEwMDAwMDBaMBox',
  'GDAWBgNVBAMTD2Zha2UtaWRwLmxvY2FsMFwwDQYJKoZIhvcNAQEBBQADSwAwSAJB',
  'AL8V1r7q0k5s3n0m5s3n0m5s3n0m5s3n0m5s3n0m5s3n0m5s3n0m5s3n0m5s3n0m',
  '5s3n0m5s3n0m5s3n0mAgMBAAEwDQYJKoZIhvcNAQEFBQADQQAA',
  '-----END CERTIFICATE-----',
].join('\n');

function configWith(values: Record<string, string | undefined>): ConfigService {
  return { get: (key: string) => values[key] } as unknown as ConfigService;
}

const unconfigured = configWith({});
const configured = configWith({
  SSO_SAML_ENTRY_POINT: 'https://idp.example.com/sso',
  SSO_SAML_ISSUER: 'urn:pee:sp',
  SSO_SAML_IDP_CERT: FAKE_CERT,
  SSO_SAML_CALLBACK_URL: 'https://api.example.com/auth/sso/saml/acs',
});

describe('SamlService', () => {
  it('reports not configured when required env vars are missing', () => {
    expect(new SamlService(unconfigured).isConfigured()).toBe(false);
  });

  it('reports configured once entryPoint/issuer/idpCert/callbackUrl are all set', () => {
    expect(new SamlService(configured).isConfigured()).toBe(true);
  });

  it('throws ServiceUnavailableException from getAuthorizeUrl when not configured', async () => {
    await expect(new SamlService(unconfigured).getAuthorizeUrl('state')).rejects.toThrow(ServiceUnavailableException);
  });

  it('throws ServiceUnavailableException from validateResponse when not configured', async () => {
    await expect(new SamlService(unconfigured).validateResponse('x', 'state')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('builds a real authorize URL pointing at the configured entryPoint', async () => {
    const url = await new SamlService(configured).getAuthorizeUrl('relay-state-value');
    expect(url.startsWith('https://idp.example.com/sso')).toBe(true);
    expect(url).toContain('SAMLRequest=');
  });

  it('fails closed on a garbage SAMLResponse instead of ever fabricating an identity', async () => {
    await expect(new SamlService(configured).validateResponse('not-base64-xml', 'relay-state')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('fails closed on a well-formed-but-unsigned SAML response', async () => {
    const unsignedResponse = Buffer.from(
      `<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_r1" Version="2.0" IssueInstant="2026-01-01T00:00:00Z">
        <saml:Issuer>https://idp.example.com</saml:Issuer>
        <samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
        <saml:Assertion ID="_a1" Version="2.0" IssueInstant="2026-01-01T00:00:00Z">
          <saml:Issuer>https://idp.example.com</saml:Issuer>
          <saml:Subject><saml:NameID>user@example.com</saml:NameID></saml:Subject>
          <saml:Conditions NotBefore="2026-01-01T00:00:00Z" NotOnOrAfter="2036-01-01T00:00:00Z"/>
        </saml:Assertion>
      </samlp:Response>`,
    ).toString('base64');

    await expect(new SamlService(configured).validateResponse(unsignedResponse, 'relay-state')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
