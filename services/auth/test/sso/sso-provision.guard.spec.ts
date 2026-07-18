import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SsoProvisionGuard } from '../../src/sso/guards/sso-provision.guard';

function buildContext(headers: Record<string, string>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ headers }) }),
  } as unknown as ExecutionContext;
}

describe('SsoProvisionGuard', () => {
  let config: jest.Mocked<ConfigService>;
  let guard: SsoProvisionGuard;

  beforeEach(() => {
    config = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    guard = new SsoProvisionGuard(config);
  });

  it('rejects when SSO_INTERNAL_SECRET is not configured, even with a header present', () => {
    config.get.mockReturnValue(undefined);
    expect(() => guard.canActivate(buildContext({ 'x-sso-internal-secret': 'anything' }))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when the header is missing', () => {
    config.get.mockReturnValue('correct-secret');
    expect(() => guard.canActivate(buildContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects when the header does not match', () => {
    config.get.mockReturnValue('correct-secret');
    expect(() => guard.canActivate(buildContext({ 'x-sso-internal-secret': 'wrong' }))).toThrow(UnauthorizedException);
  });

  it('allows the request through when the header matches', () => {
    config.get.mockReturnValue('correct-secret');
    expect(guard.canActivate(buildContext({ 'x-sso-internal-secret': 'correct-secret' }))).toBe(true);
  });
});
