# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 1 — Authentication — **complete**.
- **Epic:** Implement the `auth` NestJS module and Auth.js frontend against the Phase 0.5 ADRs. **Complete.**
- **Feature / Task:** None active. Awaiting user direction to scope Phase 2 (Projects).
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phase 1 (Authentication): 100% of scoped work — register/login/refresh/logout/me, rotation + reuse detection, rate limiting, audit logging, Next.js/Auth.js frontend, unit tests passing, integration/e2e tests written (not executed in the authoring sandbox — no Docker there). Overall project (Phase 0-10): Phases 0, 0.5, 1 done; Phases 2-10 not started.

## Known blockers

None. Integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`, `apps/web/e2e/login.spec.ts`) require a real Postgres via Docker and have not been run yet in any environment with Docker available — run them before treating Phase 1 as fully verified end-to-end. See [20-known-issues.md](20-known-issues.md).

## Upcoming work

Scope Phase 2 (Projects) once directed. Before then: run the Docker-dependent integration/e2e suite at least once (`docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`, then `npm run test:e2e -w @pee/auth` and `-w web`) to confirm the full flow against a live database and browser.

## Estimated next milestone

Phase 2 (Projects) scoped and implemented against the Phase 1 auth foundation.
