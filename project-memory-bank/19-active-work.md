# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 5 — Memory Engine — **complete**.
- **Epic:** Design and implement the first real SQLite↔Postgres sync protocol (`adr/0003`'s deferred decision) — `services/sync` + `packages/local-client` — against the Phase 1 auth + Phase 2 projects + Phase 3 planning + Phase 4 execution foundation. **Complete.**
- **Feature / Task:** None active. Awaiting user direction to scope Phase 6 (AI Integration).
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phase 1 (Authentication): 100%. Phase 2 (Projects): 100%. Phase 3 (Planning Engine): 100%. Phase 4 (Execution Engine): 100%. Phase 5 (Memory Engine): 100% of scoped work — `/sync/pull`+`/sync/push`, version-guard + last-write-wins conflict resolution, `packages/local-client` reference SQLite client, unit tests passing, integration/e2e tests written (not executed in the authoring sandbox — no Docker there). Overall project (Phase 0-10): Phases 0, 0.5, 1, 2, 3, 4, 5 done; Phases 6-10 not started.

## Known blockers

None blocking further scoping. Two carried-forward gaps, both requiring Docker/Postgres, which has not been available in any session so far:
1. Integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`, `services/projects/test/projects.e2e-spec.ts`, `services/planning/test/planning.e2e-spec.ts`, `services/execution/test/execution.e2e-spec.ts`, `services/sync/test/sync.e2e-spec.ts`, `packages/local-client/test/sync-roundtrip.e2e-spec.ts`, `apps/web/e2e/login.spec.ts`, `apps/web/e2e/projects.spec.ts`, `apps/web/e2e/planning.spec.ts`, `apps/web/e2e/execution.spec.ts`) have never been run.
2. No Prisma migration has ever been generated (`prisma/migrations/` doesn't exist), so `prisma migrate deploy` (CI/prod) currently has nothing to apply.

See [20-known-issues.md](20-known-issues.md).

## Upcoming work

Scope Phase 6 (AI Integration) once directed. Before then, ideally in an environment with Docker: generate the first migration (`npx prisma migrate dev --name init`), apply it, then run the Docker-dependent test suites for Phases 1-5 to confirm the full stack end-to-end.

## Estimated next milestone

Phase 6 (AI Integration) scoped and implemented against the Phase 1 (auth) + Phase 2 (projects) + Phase 3 (planning) + Phase 4 (execution) + Phase 5 (sync) foundation.
