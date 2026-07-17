import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../src/token.service';

function buildTokenService(env: Record<string, string> = {}): TokenService {
  const config = new ConfigService(env);
  const jwt = new JwtService({ secret: 'unit-test-secret' });
  return new TokenService(jwt, config);
}

describe('TokenService', () => {
  it('signs an access token that verifies back to the original payload', () => {
    const tokenService = buildTokenService({ JWT_ACCESS_TTL: '15m' });
    const { token, expiresAt } = tokenService.signAccessToken({ sub: 'user-1', email: 'a@b.com', role: 'USER' });

    const payload = tokenService.verifyAccessToken(token);
    expect(payload.sub).toBe('user-1');
    expect(payload.email).toBe('a@b.com');
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('rejects a tampered access token', () => {
    const tokenService = buildTokenService();
    const { token } = tokenService.signAccessToken({ sub: 'user-1', email: 'a@b.com', role: 'USER' });
    expect(() => tokenService.verifyAccessToken(`${token}tampered`)).toThrow();
  });

  it('generates a refresh token whose raw value is never equal to its stored hash', () => {
    const tokenService = buildTokenService({ JWT_REFRESH_TTL: '7d' });
    const { raw, hash, expiresAt } = tokenService.generateRefreshToken();

    expect(raw).not.toEqual(hash);
    expect(tokenService.hashToken(raw)).toEqual(hash);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('generates unique refresh tokens on each call', () => {
    const tokenService = buildTokenService();
    const first = tokenService.generateRefreshToken();
    const second = tokenService.generateRefreshToken();
    expect(first.raw).not.toEqual(second.raw);
  });
});
