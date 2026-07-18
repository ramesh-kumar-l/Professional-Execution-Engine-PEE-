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
| 6 | AI Integration | Not started |
| 7 | Analytics | Not started |
| 8 | Desktop | Not started |
| 9 | Mobile | Not started |
| 10 | Enterprise | Not started |

## Current sub-phase: Phase 5 implemented

Phase 0's EOS bootstrap and Phase 0.5's architecture ADRs completed 2026-07-16/17. Phase 1 — Authentication — implemented 2026-07-17. Phase 2 — Projects, Phase 3 — Planning Engine, and Phase 4 — Execution Engine — implemented 2026-07-18. Phase 5 — Memory Engine — implemented 2026-07-18: `services/sync` (NestJS module, `POST /sync/pull`/`POST /sync/push`, registry-driven bidirectional sync for `Project`/`Goal`/`Task`, atomic optimistic-lock version guard falling back to last-write-wins-by-timestamp), `packages/local-client` (reusable reference SQLite client — `LocalStore` + `SyncClient` — proving the protocol against a real embedded database), composite `[ownerId, updatedAt]` indexes + a finally-live `version` column in `packages/database`. This is `adr/0003`'s deferred sync protocol, designed and working; `apps/web` was deliberately left untouched (confirmed 100% server-rendered, no client-side storage — the browser-offline retrofit is Phase 8/9's job). See [17-phase-status.md](17-phase-status.md), [02-prd.md](02-prd.md) for exit criteria and acceptance status, and [18-current-state.md](18-current-state.md) for what's implemented.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
