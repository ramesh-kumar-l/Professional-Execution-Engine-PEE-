# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 7 — Analytics — **complete**.
- **Epic:** Scope and ship a read/reporting layer over Phases 2-6's existing data — `services/analytics` (summary/velocity/time-tracking) — satisfying the literal exit criterion that metrics live in `dashboard/METRICS.md`. **Complete.**
- **Feature / Task:** None active. Awaiting user direction to scope Phase 8 (Desktop).
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phase 1 (Authentication): 100%. Phase 2 (Projects): 100%. Phase 3 (Planning Engine): 100%. Phase 4 (Execution Engine): 100%. Phase 5 (Memory Engine): 100%. Phase 6 (AI Integration): 100%. Phase 7 (Analytics): 100% of scoped work — three read endpoints, `apps/web` dashboard page, `dashboard/METRICS.md` rewritten, unit tests passing, integration/e2e test written (needs Docker only — not executed in the authoring sandbox). Overall project (Phase 0-10): Phases 0, 0.5, 1, 2, 3, 4, 5, 6, 7 done; Phases 8-10 not started.

## Known blockers

None blocking further scoping. Carried-forward gaps, all requiring Docker/Postgres, which has not been available in any session so far:
1. Integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`, `services/projects/test/projects.e2e-spec.ts`, `services/planning/test/planning.e2e-spec.ts`, `services/execution/test/execution.e2e-spec.ts`, `services/sync/test/sync.e2e-spec.ts`, `packages/local-client/test/sync-roundtrip.e2e-spec.ts`, `services/ai/test/ai.e2e-spec.ts`, `services/analytics/test/analytics.e2e-spec.ts`, `apps/web/e2e/*.spec.ts`) have never been run.
2. No Prisma migration has ever been generated (`prisma/migrations/` doesn't exist), so `prisma migrate deploy` (CI/prod) currently has nothing to apply — Phase 7's new composite index is not exempt from this gap.
3. Carried forward from Phase 6, unchanged: no automated test exercises a real network call to the live Anthropic/OpenAI APIs (requires real vendor credentials) — a manual smoke test is recommended before relying on that feature in a live environment.

See [20-known-issues.md](20-known-issues.md).

## Upcoming work

Scope Phase 8 (Desktop) once directed. Before then, ideally in an environment with Docker: generate the first migration (`npx prisma migrate dev --name init`), apply it, then run the Docker-dependent test suites for Phases 1-7 to confirm the full stack end-to-end; separately, a real vendor-credentialed smoke test of `services/ai` before it's relied on in production.

## Estimated next milestone

Phase 8 (Desktop) scoped and implemented against the Phase 1-7 foundation.
