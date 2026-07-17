# 08 — Backend Guidelines

Operational standards live in `claude/BACKEND.md` — not duplicated here. This file tracks the *product-specific* backend state.

## Current state

**Status: Phase 1 implemented, 2026-07-17.** TypeScript/NestJS modular monolith per `adr/0002`, npm workspaces.

## Module map

- **`/services/api`** (`@pee/api`) — composition root: `main.ts` (helmet, global `ValidationPipe`), `app.module.ts` (imports `ConfigModule`, `ThrottlerModule` with a global `ThrottlerGuard`, `PrismaModule`, `AuthModule`), `HealthController` (`GET /health`).
- **`/services/auth`** (`@pee/auth`) — system of record for users/credentials, per `adr/0005`. `AuthController` (`/auth/register`, `/login`, `/refresh`, `/logout`, `/me`), `AuthService` (orchestration), `TokenService` (JWT access + opaque hashed refresh tokens), `PasswordService` (argon2), `AuditLogService`, `JwtStrategy`/`JwtAuthGuard`/`CurrentUser` decorator. Owns `User`, `RefreshToken`, `AuthAuditLog` — no other module reaches into this data.
- **`/packages/database`** (`@pee/database`) — Prisma schema + `PrismaService`/`PrismaModule` (`@Global()`), shared by every Nest module needing DB access. Added beyond the originally enumerated package list (`sdk`, `ui`, `design-system`, `shared`, `config`, `types`, `utils`) because every future `/services` module needs DB access — recorded in `21-decision-log.md`.
- **`/packages/types`** (`@pee/types`) — shared request/response types (`RegisterRequest`, `LoginRequest`, `AuthTokens`, `UserProfile`, ...), consumed by both `@pee/auth` and the Next.js app.

## Implementation notes worth remembering

- Refresh tokens are **opaque random strings**, not JWTs — only their SHA-256 hash is persisted, so revocation is authoritative in the database rather than depending on JWT expiry. Rotation: each `/auth/refresh` call revokes the old token and issues a new one; replaying an already-revoked token revokes the user's entire active token chain (`TOKEN_REUSE_DETECTED`).
- The browser never receives a raw JWT — Auth.js (Next.js) holds tokens server-side; see [11-api-contract.md](11-api-contract.md) and [12-security.md](12-security.md).

Do not duplicate general API/error-handling/config standards here — those live in `claude/BACKEND.md`.
