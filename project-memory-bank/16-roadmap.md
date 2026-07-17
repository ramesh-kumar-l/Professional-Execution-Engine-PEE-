# 16 — Roadmap

Source of truth: `SYSTEM_PROMPT.md` §22 (`System_Prompt/Part2.md`). Each phase must be independently releasable and deliver measurable value. Work on one phase at a time unless explicitly instructed otherwise.

## Product phases (§22)

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | Complete — EOS bootstrap + architecture ADRs (0.5) |
| 1 | Authentication | **Complete** — 2026-07-17, `auth` NestJS module + Auth.js frontend |
| 2 | Projects | Not started |
| 3 | Planning Engine | Not started |
| 4 | Execution Engine | Not started |
| 5 | Memory Engine | Not started |
| 6 | AI Integration | Not started |
| 7 | Analytics | Not started |
| 8 | Desktop | Not started |
| 9 | Mobile | Not started |
| 10 | Enterprise | Not started |

## Current sub-phase: Phase 1 implemented

Phase 0's EOS bootstrap and Phase 0.5's architecture ADRs completed 2026-07-16/17. Phase 1 — Authentication — implemented 2026-07-17: `services/auth` (NestJS module), `services/api` (composition root), `packages/database` + `packages/types`, `apps/web` (Next.js + Auth.js). See [17-phase-status.md](17-phase-status.md), [02-prd.md](02-prd.md) for exit criteria and acceptance status, and [18-current-state.md](18-current-state.md) for what's implemented.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
