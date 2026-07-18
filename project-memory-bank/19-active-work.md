# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 9 — Mobile — **complete**.
- **Epic:** Ship an Expo/React Native mobile client with the same reuse constraint as Desktop — a mobile shell whose runtime can host `packages/local-client` *or an equivalent* with no rewrite. **Complete.**
- **Feature / Task:** None active. Awaiting user direction to scope Phase 10 (Enterprise).
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phase 1 (Authentication): 100%. Phase 2 (Projects): 100%. Phase 3 (Planning Engine): 100%. Phase 4 (Execution Engine): 100%. Phase 5 (Memory Engine): 100%. Phase 6 (AI Integration): 100%. Phase 7 (Analytics): 100%. Phase 8 (Desktop): 100%. Phase 9 (Mobile): 100% of scoped work — Expo/React Native app with a ported `MobileStore`/`MobileSyncClient` (expo-sqlite, since Prisma cannot run on this runtime), IPC-free direct-call offline CRUD + sync, online-only execution/AI/analytics passthroughs, unit tests passing. Detox e2e spec written and CI-wired but **not run** (no Android emulator/iOS Simulator in this sandbox) — honestly documented, unlike Desktop's e2e which did run. Overall project (Phase 0-10): Phases 0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9 done; Phase 10 not started.

## Known blockers

None blocking further scoping. Carried-forward gaps, all requiring Docker/Postgres or a mobile device/emulator, neither of which has been available in any session so far:
1. Integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`, `services/projects/test/projects.e2e-spec.ts`, `services/planning/test/planning.e2e-spec.ts`, `services/execution/test/execution.e2e-spec.ts`, `services/sync/test/sync.e2e-spec.ts`, `packages/local-client/test/sync-roundtrip.e2e-spec.ts`, `services/ai/test/ai.e2e-spec.ts`, `services/analytics/test/analytics.e2e-spec.ts`, `apps/web/e2e/*.spec.ts`) have never been run. **Not applicable to `apps/desktop/e2e/desktop.spec.ts`** — that one needs no Postgres/Docker and was actually run successfully in Phase 8's session.
2. New this phase: `apps/mobile/e2e/mobile.e2e.ts` (Detox) also has not been run — no Android emulator/iOS Simulator was available in this sandbox, and unlike Electron there is no headless-launch fallback for Detox.
3. No Prisma migration has ever been generated (`prisma/migrations/` doesn't exist), so `prisma migrate deploy` (CI/prod) currently has nothing to apply.
4. Carried forward from Phase 6, unchanged: no automated test exercises a real network call to the live Anthropic/OpenAI APIs (requires real vendor credentials) — a manual smoke test is recommended before relying on that feature in a live environment.
5. Carried forward from Phase 8, now doubled: both `apps/desktop`'s and `apps/mobile`'s local SQLite files are unencrypted at rest, genuinely shipping to (future) end-user machines/devices rather than a hypothetical concern — see [20-known-issues.md](20-known-issues.md).

See [20-known-issues.md](20-known-issues.md).

## Upcoming work

Scope Phase 10 (Enterprise) once directed. Before then, ideally in an environment with Docker and a mobile device/emulator: generate the first migration (`npx prisma migrate dev --name init`), apply it, then run the Docker-dependent test suites for Phases 1-9 to confirm the full stack end-to-end; run `apps/mobile`'s Detox e2e spec on a real Android emulator/iOS Simulator; separately, a real vendor-credentialed smoke test of `services/ai` before it's relied on in production; separately, revisit local SQLite file-at-rest encryption on both `apps/desktop` and `apps/mobile` before either reaches real users.

## Estimated next milestone

Phase 10 (Enterprise) scoped and implemented against the Phase 1-9 foundation.
