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
| 7 | Analytics | Not started |
| 8 | Desktop | Not started |
| 9 | Mobile | Not started |
| 10 | Enterprise | Not started |

## Current sub-phase: Phase 6 implemented

Phase 0's EOS bootstrap and Phase 0.5's architecture ADRs completed 2026-07-16/17. Phase 1 — Authentication — implemented 2026-07-17. Phase 2 — Projects, Phase 3 — Planning Engine, Phase 4 — Execution Engine, and Phase 5 — Memory Engine — implemented 2026-07-18. Phase 6 — AI Integration — implemented 2026-07-18: `services/ai` (NestJS module — `AIProvider` interface exposing `complete()`, a config-selected DI factory constructing only the active vendor's implementation, `AnthropicProvider`/`OpenAIProvider` proven against a shared behavioral contract) plus its first real feature — goal → task-breakdown suggestions (`POST`/`GET /goals/:goalId/ai/task-suggestions`, `POST /ai/recommendations/:id/accept|dismiss`), gated behind explicit human approval and carrying reason/confidence/alternatives on every suggestion. This is `adr/0006`'s deferred provider abstraction, designed and working, not just an interface with no consumer. See [17-phase-status.md](17-phase-status.md), [02-prd.md](02-prd.md) for exit criteria and acceptance status, and [18-current-state.md](18-current-state.md) for what's implemented.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
