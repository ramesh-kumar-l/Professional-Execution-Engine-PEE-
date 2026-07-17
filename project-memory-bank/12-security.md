# 12 — Security

Standards live in `claude/SECURITY.md` (source: `SYSTEM_PROMPT.md` §45). This file tracks the *product-specific* security posture.

## Status

**Phase 1 auth/authz model implemented, 2026-07-17** ([adr/0005](../adr/0005-authentication-strategy.md)).

## Implemented model

- **Authentication:** email/password via the NestJS `auth` module (system of record) + Auth.js (NextAuth) on the Next.js frontend. Passwords hashed with argon2 (`PasswordService`). Access tokens are short-lived JWTs (default 15m); refresh tokens are opaque random strings — only their SHA-256 hash is persisted, so revocation is authoritative in the database, not dependent on JWT expiry.
- **Token custody (BFF pattern):** the browser never holds a raw access/refresh token. Auth.js's server-side session (encrypted httpOnly cookie) is the only thing the browser gets; the Next.js server calls the NestJS API directly. Removes CORS/token-exposure risk for the browser entirely at this phase.
- **Refresh rotation + reuse detection:** every `/auth/refresh` call revokes the presented token and issues a new one; presenting an already-revoked token revokes the user's *entire* active token chain and logs `TOKEN_REUSE_DETECTED` — standard theft-detection pattern.
- **Authorization:** a `role` field exists on `User` (`USER` today) as a least-privilege hook; not yet exercised by any endpoint (single role in Phase 1).
- **Rate limiting:** `@nestjs/throttler`, global default (100/min) plus tighter limits on `/auth/register` (5/min) and `/auth/login` (10/min).
- **Audit logging:** `AuthAuditLog` records `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `TOKEN_REUSE_DETECTED`.
- **Secrets:** `.env` (never committed; `.env.example` documents required keys), read via `@nestjs/config`.
- **Transport security:** `helmet()` sets standard security headers; TLS termination is a deployment-time requirement (`adr/0004`), not application code.
- **No sensitive data in logs:** only `tokenHash` is ever persisted for refresh tokens; passwords and raw tokens never appear in any log statement.
- **Dependency scan:** `npm audit` run 2026-07-17 — remaining findings (Next.js, NestJS/Express-chain transitive advisories) all require a major-version bump (Next 16, Nest 11) to clear; deliberately not force-upgraded mid-feature. Tracked in [20-known-issues.md](20-known-issues.md).
- **Compliance:** none identified yet.

Do not duplicate the general security requirements checklist here — it lives in `claude/SECURITY.md` and `checklists/security-checklist.md`.
