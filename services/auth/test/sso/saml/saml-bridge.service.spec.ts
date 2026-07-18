import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SamlBridgeService } from '../../../src/sso/saml/saml-bridge.service';

describe('SamlBridgeService', () => {
  let config: jest.Mocked<ConfigService>;
  let service: SamlBridgeService;

  beforeEach(() => {
    config = { get: jest.fn().mockReturnValue('test-bridge-secret') } as unknown as jest.Mocked<ConfigService>;
    service = new SamlBridgeService(new JwtService({}), config);
  });

  describe('relay state', () => {
    it('round-trips state/redirectUri through a real signed JWT', () => {
      const relayState = service.encodeRelayState({ state: 'abc123', redirectUri: 'https://web.example/callback' });
      const decoded = service.decodeRelayState(relayState);
      expect(decoded).toEqual(
        expect.objectContaining({ state: 'abc123', redirectUri: 'https://web.example/callback' }),
      );
    });

    it('rejects a tampered relay state', () => {
      const relayState = service.encodeRelayState({ state: 'abc123', redirectUri: 'https://web.example/callback' });
      const tampered = relayState.slice(0, -1) + (relayState.endsWith('a') ? 'b' : 'a');
      expect(() => service.decodeRelayState(tampered)).toThrow(UnauthorizedException);
    });
  });

  describe('one-time code', () => {
    const identity = { nameId: 'nameid-1', email: 'user@example.com' };

    it('is redeemable exactly once', () => {
      const code = service.issueOneTimeCode(identity);
      expect(service.redeemOneTimeCode(code)).toEqual(identity);
      expect(() => service.redeemOneTimeCode(code)).toThrow(UnauthorizedException);
    });

    it('rejects an invalid code', () => {
      expect(() => service.redeemOneTimeCode('not-a-real-token')).toThrow(UnauthorizedException);
    });
  });

  describe('access token', () => {
    it('round-trips an identity without single-use restrictions', () => {
      const identity = { nameId: 'nameid-2', email: 'user2@example.com' };
      const token = service.issueAccessToken(identity);
      expect(service.decodeAccessToken(token)).toEqual(expect.objectContaining(identity));
      expect(service.decodeAccessToken(token)).toEqual(expect.objectContaining(identity)); // decoding twice is fine, unlike the one-time code
    });
  });

  describe('missing SSO_SAML_BRIDGE_SECRET', () => {
    it('fails closed with 503 instead of falling back to another secret', () => {
      const unconfigured = { get: jest.fn().mockReturnValue(undefined) } as unknown as jest.Mocked<ConfigService>;
      const unconfiguredService = new SamlBridgeService(new JwtService({}), unconfigured);

      expect(() => unconfiguredService.issueOneTimeCode({ nameId: 'n', email: 'e@example.com' })).toThrow(
        ServiceUnavailableException,
      );
      // Proves there's no silent reuse of any other configured secret (e.g. JWT_ACCESS_SECRET).
      expect(unconfigured.get).toHaveBeenCalledWith('SSO_SAML_BRIDGE_SECRET');
      expect(unconfigured.get).not.toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    });
  });
});
