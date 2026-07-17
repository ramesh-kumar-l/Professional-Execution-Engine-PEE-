# 28 — Session Handoff

Source of truth for process: `SYSTEM_PROMPT.md` §31, §87 (`System_Prompt/Part2.md`, `Part5.md`). Updated at the end of every session; live draft during a session lives in `session/session-handoff.md`.

## Latest handoff — 2026-07-17 (Phase 1)

**Current phase:** 1 — Authentication. **Complete.**

**Completed work:** Implemented the first real product code in the repo. npm workspaces scaffold (`packages/*`, `services/*`, `apps/*`); `packages/database` (Prisma schema: `User`/`RefreshToken`/`AuthAuditLog`, `PrismaService`); `packages/types` (shared auth DTOs); `services/auth` (`AuthController`/`AuthService`/`TokenService`/`PasswordService`/`AuditLogService`, JWT access + opaque hashed refresh tokens with rotation and reuse detection, argon2, rate limiting, audit logging); `services/api` (composition root — helmet, global validation, throttler guard); `apps/web` (Next.js 14 + Auth.js v5 — `/login`, `/register`, `/dashboard`, middleware route protection, BFF token-custody pattern so the browser never holds a raw JWT). Added `infrastructure/docker/docker-compose.dev.yml` and `.github/workflows/ci.yml`. Wrote 26 unit/DTO tests (all passing) plus integration/e2e specs requiring Docker Postgres. Updated `02-prd.md`, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `16-roadmap.md`, `17-phase-status.md`, `18-current-state.md`, `19-active-work.md`, `20-known-issues.md`, `21-decision-log.md`, `27-backlog.md`, plus `dashboard/*` and `session/*`.

**Pending work:** Phase 2 (Projects) — not yet scoped. Before that: run the Docker-dependent integration/e2e suite at least once in an environment with Docker (the authoring sandbox had none) to confirm the full flow end-to-end.

**Known issues:** See [20-known-issues.md](20-known-issues.md) — sync protocol still deferred (`adr/0003`); `npm audit` findings that need a Nest 11/Next 16 major-version bump (tracked, not force-upgraded); auth/frontend e2e specs unexecuted in this sandbox.

**Open decisions:** None blocking Phase 2. OAuth social login, email verification, and password reset are explicitly deferred (see [27-backlog.md](27-backlog.md)), not silently dropped.

**Recommended next task:** Run the Docker-dependent e2e suite once Docker is available, then get user direction on Phase 2 (Projects) scope.

**Memory-bank files to load next session:** `00-project-vision.md`, `17-phase-status.md`, `18-current-state.md`, `19-active-work.md`, `29-next-task.md` (standard priority order, `claude/STARTUP.md`).
