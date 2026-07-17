# 12 — Security

Standards live in `claude/SECURITY.md` (source: `SYSTEM_PROMPT.md` §45). This file tracks the *product-specific* security posture.

## Status

**Phase 3 authz model extended, 2026-07-18** — nested ownership (Goal under Project, Task under Goal) added on top of the Phase 2 ownership model ([adr/0005](../adr/0005-authentication-strategy.md)).

## Implemented model

- **Authentication:** email/password via the NestJS `auth` module (system of record) + Auth.js (NextAuth) on the Next.js frontend. Passwords hashed with argon2 (`PasswordService`). Access tokens are short-lived JWTs (default 15m); refresh tokens are opaque random strings — only their SHA-256 hash is persisted, so revocation is authoritative in the database, not dependent on JWT expiry.
- **Token custody (BFF pattern):** the browser never holds a raw access/refresh token. Auth.js's server-side session (encrypted httpOnly cookie) is the only thing the browser gets; the Next.js server calls the NestJS API directly. Removes CORS/token-exposure risk for the browser entirely at this phase.
- **Refresh rotation + reuse detection:** every `/auth/refresh` call revokes the presented token and issues a new one; presenting an already-revoked token revokes the user's *entire* active token chain and logs `TOKEN_REUSE_DETECTED` — standard theft-detection pattern.
- **Authorization:** a `role` field exists on `User` (`USER` today) as a least-privilege hook; not yet exercised by any endpoint (single role). **Resource-level authorization (Phase 2):** every `/projects/*` route requires `JwtAuthGuard`; `ProjectsService` additionally enforces ownership (`project.ownerId === currentUser.id`) before any read or write, throwing `NotFoundException` — not `ForbiddenException` — on mismatch, so a 404 response never confirms or denies that a given project ID exists for another user. This ownership-check pattern is the model for every future domain module. **Nested authorization (Phase 3):** `Goal` and `Task` each carry their own `ownerId` and are checked directly (same 404-not-403 rule) — `GoalsService`/`TasksService` don't need to walk up to the parent for a routine read/write. Goal *creation* is the one case that must check the parent first: `GoalsService.create` calls `ProjectsService.getOne(ownerId, projectId)` before creating a goal under it, so a caller can't create goals under a project they don't own. This crosses a module boundary through `ProjectsService`'s already-public API, not raw Prisma access — no internals of `@pee/projects` were changed to make this work.
- **Rate limiting:** `@nestjs/throttler`, global default (100/min) plus tighter limits on `/auth/register` (5/min) and `/auth/login` (10/min). `/projects/*` and `/goals/*`/`/tasks/*` rely on the global default only — CRUD on owned resources isn't a credential-guessing surface, so no tighter per-route limit was added.
- **Audit logging:** `AuthAuditLog` records `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `TOKEN_REUSE_DETECTED`. **Gap, not silently dropped:** project/goal/task CRUD actions are not audit-logged — `AuthAuditLog` is auth-event-specific and a general-purpose audit trail for domain entities hasn't been designed yet, now spanning three entities without one. Deferred until a real compliance/observability need identifies what should be captured; see [20-known-issues.md](20-known-issues.md) and [27-backlog.md](27-backlog.md).
- **Secrets:** `.env` (never committed; `.env.example` documents required keys), read via `@nestjs/config`.
- **Transport security:** `helmet()` sets standard security headers; TLS termination is a deployment-time requirement (`adr/0004`), not application code.
- **No sensitive data in logs:** only `tokenHash` is ever persisted for refresh tokens; passwords and raw tokens never appear in any log statement.
- **Dependency scan:** `npm audit` run 2026-07-17 — remaining findings (Next.js, NestJS/Express-chain transitive advisories) all require a major-version bump (Next 16, Nest 11) to clear; deliberately not force-upgraded mid-feature. Tracked in [20-known-issues.md](20-known-issues.md).
- **Compliance:** none identified yet.

Do not duplicate the general security requirements checklist here — it lives in `claude/SECURITY.md` and `checklists/security-checklist.md`.
