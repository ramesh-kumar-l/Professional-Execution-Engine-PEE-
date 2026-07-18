# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 8 — Desktop — **complete**.
- **Epic:** Ship an Electron desktop client that reuses the same API, design conventions, and `packages/local-client` (Phase 5's reusable SQLite reference client, previously unconsumed) with no rewrite. **Complete.**
- **Feature / Task:** None active. Awaiting user direction to scope Phase 9 (Mobile).
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phase 1 (Authentication): 100%. Phase 2 (Projects): 100%. Phase 3 (Planning Engine): 100%. Phase 4 (Execution Engine): 100%. Phase 5 (Memory Engine): 100%. Phase 6 (AI Integration): 100%. Phase 7 (Analytics): 100%. Phase 8 (Desktop): 100% of scoped work — Electron app consuming `@pee/local-client` unmodified, IPC-based offline CRUD + sync, online-only execution/AI/analytics passthroughs, unit tests passing, Playwright e2e **actually run and passing** in the authoring sandbox. Overall project (Phase 0-10): Phases 0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8 done; Phases 9-10 not started.

## Known blockers

None blocking further scoping. Carried-forward gaps, all requiring Docker/Postgres, which has not been available in any session so far:
1. Integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`, `services/projects/test/projects.e2e-spec.ts`, `services/planning/test/planning.e2e-spec.ts`, `services/execution/test/execution.e2e-spec.ts`, `services/sync/test/sync.e2e-spec.ts`, `packages/local-client/test/sync-roundtrip.e2e-spec.ts`, `services/ai/test/ai.e2e-spec.ts`, `services/analytics/test/analytics.e2e-spec.ts`, `apps/web/e2e/*.spec.ts`) have never been run. **Not applicable to `apps/desktop/e2e/desktop.spec.ts`** — that one needs no Postgres/Docker and was actually run successfully this session.
2. No Prisma migration has ever been generated (`prisma/migrations/` doesn't exist), so `prisma migrate deploy` (CI/prod) currently has nothing to apply.
3. Carried forward from Phase 6, unchanged: no automated test exercises a real network call to the live Anthropic/OpenAI APIs (requires real vendor credentials) — a manual smoke test is recommended before relying on that feature in a live environment.
4. New this phase: `apps/desktop`'s local SQLite file is unencrypted at rest, now genuinely shipping to (future) end-user machines rather than a hypothetical concern — see [20-known-issues.md](20-known-issues.md).

See [20-known-issues.md](20-known-issues.md).

## Upcoming work

Scope Phase 9 (Mobile) once directed. Before then, ideally in an environment with Docker: generate the first migration (`npx prisma migrate dev --name init`), apply it, then run the Docker-dependent test suites for Phases 1-8 to confirm the full stack end-to-end; separately, a real vendor-credentialed smoke test of `services/ai` before it's relied on in production; separately, revisit local SQLite file-at-rest encryption before `apps/desktop` reaches real users.

## Estimated next milestone

Phase 9 (Mobile) scoped and implemented against the Phase 1-8 foundation.
