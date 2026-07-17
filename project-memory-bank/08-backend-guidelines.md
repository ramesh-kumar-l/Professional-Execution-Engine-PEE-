# 08 — Backend Guidelines

Operational standards live in `claude/BACKEND.md` — not duplicated here. This file tracks the *product-specific* backend state.

## Current state

**Status: Phase 2 implemented, 2026-07-18.** TypeScript/NestJS modular monolith per `adr/0002`, npm workspaces.

## Module map

- **`/services/api`** (`@pee/api`) — composition root: `main.ts` (helmet, global `ValidationPipe`), `app.module.ts` (imports `ConfigModule`, `ThrottlerModule` with a global `ThrottlerGuard`, `PrismaModule`, `AuthModule`, `ProjectsModule`), `HealthController` (`GET /health`).
- **`/services/auth`** (`@pee/auth`) — system of record for users/credentials, per `adr/0005`. `AuthController` (`/auth/register`, `/login`, `/refresh`, `/logout`, `/me`), `AuthService` (orchestration), `TokenService` (JWT access + opaque hashed refresh tokens), `PasswordService` (argon2), `AuditLogService`, `JwtStrategy`/`JwtAuthGuard`/`CurrentUser` decorator. Owns `User`, `RefreshToken`, `AuthAuditLog` — no other module reaches into this data. `JwtAuthGuard`, `CurrentUser`, and `CurrentUserPayload` are exported for reuse by other modules that need an authenticated caller (e.g. `@pee/projects`).
- **`/services/projects`** (`@pee/projects`) — first domain-entity module. `ProjectsController` (`/projects` CRUD, all routes `JwtAuthGuard`-protected), `ProjectsService` (Prisma access + ownership enforcement — `findOwnedOrThrow` throws `NotFoundException` for both "doesn't exist" and "not yours"). Owns `Project`.
- **`/packages/database`** (`@pee/database`) — Prisma schema + `PrismaService`/`PrismaModule` (`@Global()`), shared by every Nest module needing DB access. Added beyond the originally enumerated package list (`sdk`, `ui`, `design-system`, `shared`, `config`, `types`, `utils`) because every future `/services` module needs DB access — recorded in `21-decision-log.md`.
- **`/packages/types`** (`@pee/types`) — shared request/response types (`RegisterRequest`, `LoginRequest`, `AuthTokens`, `UserProfile`, `CreateProjectRequest`, `UpdateProjectRequest`, `ProjectResponse`, `ListProjectsQuery`, `PaginatedResponse<T>`, ...), consumed by both `@pee/auth`/`@pee/projects` and the Next.js app.

## Implementation notes worth remembering

- Refresh tokens are **opaque random strings**, not JWTs — only their SHA-256 hash is persisted, so revocation is authoritative in the database rather than depending on JWT expiry. Rotation: each `/auth/refresh` call revokes the old token and issues a new one; replaying an already-revoked token revokes the user's entire active token chain (`TOKEN_REUSE_DETECTED`).
- The browser never receives a raw JWT — Auth.js (Next.js) holds tokens server-side; see [11-api-contract.md](11-api-contract.md) and [12-security.md](12-security.md).
- **Ownership pattern, reusable for future domain modules:** a resource module (e.g. `@pee/projects`) never trusts a caller-supplied ID alone — it always re-checks `resource.ownerId === currentUser.id` in the service layer and returns 404 (not 403) on mismatch, so a caller can't distinguish "doesn't exist" from "exists but isn't yours."
- **Soft delete pattern:** `DELETE` routes on domain entities set a `status`/`archivedAt` field rather than removing the row — same convention `Project` uses, expected to carry forward to future entities (Tasks, etc.).
- **No Prisma migration has been generated yet** — `prisma/migrations/` doesn't exist in the repo because no Docker/Postgres has been available in the authoring sandbox to run `prisma migrate dev` against. See [20-known-issues.md](20-known-issues.md).

Do not duplicate general API/error-handling/config standards here — those live in `claude/BACKEND.md`.
