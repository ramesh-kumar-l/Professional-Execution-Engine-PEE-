import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Server-to-server only: apps/web's Auth.js backend calls the SSO provisioning
 * endpoints directly, the browser never does. Without this, a caller could mint
 * an SsoIdentity for an arbitrary email/providerUserId and get issued real tokens
 * — this guard is the one positive control standing between "trusted network"
 * and "anyone on the internet." See adr/0009 and 12-security.md.
 */
@Injectable()
export class SsoProvisionGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const expected = this.config.get<string>('SSO_INTERNAL_SECRET');
    const provided = request.headers['x-sso-internal-secret'];
    if (!expected || !this.matches(provided, expected)) {
      throw new UnauthorizedException('Invalid or missing SSO provisioning secret');
    }
    return true;
  }

  /** Constant-time comparison — a plain `!==` would let an attacker infer the secret byte-by-byte via timing. */
  private matches(provided: unknown, expected: string): boolean {
    if (typeof provided !== 'string' || provided.length !== expected.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  }
}
