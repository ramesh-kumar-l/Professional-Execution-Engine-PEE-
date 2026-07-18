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
| 8 | Desktop | Not started |
| 9 | Mobile | Not started |
| 10 | Enterprise | Not started |

## Current sub-phase: Phase 7 implemented

Phase 0's EOS bootstrap and Phase 0.5's architecture ADRs completed 2026-07-16/17. Phase 1 — Authentication — implemented 2026-07-17. Phase 2 — Projects, Phase 3 — Planning Engine, Phase 4 — Execution Engine, Phase 5 — Memory Engine, and Phase 6 — AI Integration — implemented 2026-07-18. Phase 7 — Analytics — implemented 2026-07-18: `services/analytics` (NestJS module — three owner-scoped read endpoints, each backed by its own small service: `GET /analytics/summary`, `GET /analytics/velocity`, `GET /analytics/time-tracking`), a read-only reporting layer over Phases 2-6's existing tables (no new domain model — only one supporting composite index on `ExecutionEvent`), rendered at `apps/web`'s `/dashboard/analytics`. `dashboard/METRICS.md` was rewritten to document this as the live metrics contract — the phase's literal exit criterion. See [17-phase-status.md](17-phase-status.md), [02-prd.md](02-prd.md) for exit criteria and acceptance status, and [18-current-state.md](18-current-state.md) for what's implemented.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
