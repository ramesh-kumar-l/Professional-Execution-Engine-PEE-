# 28 — Session Handoff

Source of truth for process: `SYSTEM_PROMPT.md` §31, §87 (`System_Prompt/Part2.md`, `Part5.md`). Updated at the end of every session; live draft during a session lives in `session/session-handoff.md`.

## Latest handoff — 2026-07-18 (Phase 2)

**Current phase:** 2 — Projects. **Complete.**

**Completed work:** Implemented the first domain-entity feature on top of Phase 1's auth foundation. `Project` model added to `packages/database` (Prisma: `ProjectStatus` enum, ownership via `ownerId` FK, soft delete via `status`/`archivedAt`); project DTOs added to `packages/types`; `services/projects` (`ProjectsController`/`ProjectsService` — create/list/get/update/archive, all `JwtAuthGuard`-protected, ownership enforced with 404-not-403 on cross-user access, pagination/status-filter/search on the list endpoint); `services/api` wired to import `ProjectsModule`; `apps/web` (`/dashboard/projects` list, `/dashboard/projects/new` create, `/dashboard/projects/[id]` edit, `ProjectForm` shared component, Bearer-authenticated project calls added to `lib/api-client.ts`). Added a projects e2e step to `.github/workflows/ci.yml`. Wrote 20 backend unit/DTO tests + 5 frontend Vitest tests (all passing) plus integration/e2e specs requiring Docker Postgres. Notably: `ProjectForm` uses the `onSubmit`+`useState` pattern (like `LoginForm`), not `useFormState` (like `RegisterForm`) — discovered mid-session that `useFormState` needs Next.js's bundled React and isn't unit-testable under plain Vitest/react-dom, so it was avoided for the one form that needed a test. Updated `02-prd.md`, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `16-roadmap.md`, `17-phase-status.md`, `18-current-state.md`, `19-active-work.md`, `20-known-issues.md`, `21-decision-log.md`, `27-backlog.md`, plus `dashboard/*` and `session/*`.

**Pending work:** Phase 3 (Planning Engine) — not yet scoped. Before that, two Docker-dependent gaps remain from Phase 1, still unresolved: (1) no integration/e2e suite has ever been run (auth, projects, or frontend), and (2) no Prisma migration has ever been generated, so nothing has actually been applied to a real database yet.

**Known issues:** See [20-known-issues.md](20-known-issues.md) — sync protocol still deferred (`adr/0003`); `npm audit` findings needing a Nest 11/Next 16 major-version bump (tracked, not force-upgraded); no migration ever generated; project actions not audit-logged; all Docker-dependent e2e specs unexecuted in this sandbox.

**Open decisions:** None blocking Phase 3. Multi-user project sharing, templates/tags, and a domain-entity audit trail are explicitly deferred (see [27-backlog.md](27-backlog.md)), not silently dropped.

**Recommended next task:** In an environment with Docker: generate and apply the first Prisma migration, then run the Docker-dependent e2e suites (auth, projects, frontend). Then get user direction on Phase 3 (Planning Engine) scope.

**Memory-bank files to load next session:** `00-project-vision.md`, `17-phase-status.md`, `18-current-state.md`, `19-active-work.md`, `29-next-task.md` (standard priority order, `claude/STARTUP.md`).
