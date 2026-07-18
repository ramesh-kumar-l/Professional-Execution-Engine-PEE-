# 16 — Roadmap

Source of truth: `SYSTEM_PROMPT.md` §22 (`System_Prompt/Part2.md`). Each phase must be independently releasable and deliver measurable value. Work on one phase at a time unless explicitly instructed otherwise.

## Product phases (§22)

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | Complete — EOS bootstrap + architecture ADRs (0.5) |
| 1 | Authentication | **Complete** — 2026-07-17, `auth` NestJS module + Auth.js frontend |
| 2 | Projects | **Complete** — 2026-07-18, `projects` NestJS module + Next.js CRUD UI |
| 3 | Planning Engine | **Complete** — 2026-07-18, `planning` NestJS module (Goal/Task decomposition, closed-loop progress rollup) + Next.js UI |
| 4 | Execution Engine | **Complete** — 2026-07-18, `execution` NestJS module (task start/complete timer, unconditional status-change event log via `@nestjs/event-emitter`, active-work dashboard) + Next.js UI |
| 5 | Memory Engine | **Complete** — 2026-07-18, `sync` NestJS module (`POST /sync/pull`/`POST /sync/push`, optimistic-lock version guard + last-write-wins conflict resolution) + `packages/local-client` (reusable reference SQLite client) |
| 6 | AI Integration | **Complete** — 2026-07-18, `ai` NestJS module (`AIProvider` interface — Anthropic + OpenAI implementations — plus its first feature: goal → task-breakdown suggestions with human accept/dismiss) |
| 7 | Analytics | **Complete** — 2026-07-18, `analytics` NestJS module (summary/velocity/time-tracking read endpoints over Phases 2-6's data, `dashboard/METRICS.md` now documents the live metrics contract) |
| 8 | Desktop | **Complete** — 2026-07-18, Electron app (`apps/desktop`) consuming `packages/local-client` unmodified |
| 9 | Mobile | **Complete** — 2026-07-18, Expo/React Native app (`apps/mobile`) consuming a ported equivalent of `packages/local-client` |
| 10 | Enterprise | Not started |

## Current sub-phase: Phase 9 implemented

Phase 0's EOS bootstrap and Phase 0.5's architecture ADRs completed 2026-07-16/17. Phase 1 — Authentication — implemented 2026-07-17. Phase 2 — Projects, Phase 3 — Planning Engine, Phase 4 — Execution Engine, Phase 5 — Memory Engine, Phase 6 — AI Integration, Phase 7 — Analytics, and Phase 8 — Desktop — implemented 2026-07-18. Phase 9 — Mobile — implemented 2026-07-18: a new Expo/React Native app (`apps/mobile`, `adr/0008`) with a `MobileStore` (expo-sqlite-backed, same table shapes and method surface as `packages/local-client`'s `LocalStore`) and a `MobileSyncClient` (a line-for-line port of `SyncClient`'s pull/push/conflict-resolution algorithm), for offline-capable Project/Goal/Task CRUD + sync; a NativeWind renderer reuses `apps/web`'s Tailwind conventions and calls the same REST contracts as `apps/desktop` for surfaces outside the sync scope. The exit criteria's "or an equivalent" clause is exercised deliberately here: Prisma's query engine has no Android/iOS binary target, so literal reuse of `@pee/local-client` was confirmed technically impossible (documented in `adr/0008`) before choosing to port the algorithm instead of reinventing it. Unlike Phase 8's Electron e2e, the Detox mobile e2e spec was written and CI-wired but could not be run in this sandbox (no Android emulator/iOS Simulator) — honestly documented as unrun. See [17-phase-status.md](17-phase-status.md), [02-prd.md](02-prd.md) for exit criteria and acceptance status, and [18-current-state.md](18-current-state.md) for what's implemented.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
