import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import { parseTtlMs } from './ttl.util';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
}

export interface SignedAccessToken {
  token: string;
  expiresAt: Date;
}

export interface GeneratedRefreshToken {
  raw: string;
  hash: string;
  expiresAt: Date;
}

/**
 * Access tokens are short-lived JWTs (stateless, verified by signature only).
 * Refresh tokens are opaque random strings whose SHA-256 hash is the only
 * thing ever persisted — this keeps revocation authoritative in the database
 * instead of relying on JWT expiry, so a stolen/reused token can be killed
 * immediately (see AuthService.refresh reuse-detection).
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(payload: AccessTokenPayload): SignedAccessToken {
    const ttl = this.config.get<string>('JWT_ACCESS_TTL', '15m');
    const token = this.jwt.sign(payload, { expiresIn: ttl });
    return { token, expiresAt: new Date(Date.now() + parseTtlMs(ttl)) };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify<AccessTokenPayload>(token);
  }

  generateRefreshToken(): GeneratedRefreshToken {
    const ttl = this.config.get<string>('JWT_REFRESH_TTL', '7d');
    const raw = randomBytes(48).toString('hex');
    return {
      raw,
      hash: this.hashToken(raw),
      expiresAt: new Date(Date.now() + parseTtlMs(ttl)),
    };
  }

  hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }
}
