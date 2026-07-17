# 16 — Roadmap

Source of truth: `SYSTEM_PROMPT.md` §22 (`System_Prompt/Part2.md`). Each phase must be independently releasable and deliver measurable value. Work on one phase at a time unless explicitly instructed otherwise.

## Product phases (§22)

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | **In progress** — EOS bootstrap complete; architecture ADRs (0.5) resolved 2026-07-17; awaiting scope for Phase 1 |
| 1 | Authentication | Not started |
| 2 | Projects | Not started |
| 3 | Planning Engine | Not started |
| 4 | Execution Engine | Not started |
| 5 | Memory Engine | Not started |
| 6 | AI Integration | Not started |
| 7 | Analytics | Not started |
| 8 | Desktop | Not started |
| 9 | Mobile | Not started |
| 10 | Enterprise | Not started |

## Current sub-phase: architecture ADRs resolved

Phase 0's EOS bootstrap (Group 0-12, per `C:\Users\Ramesh\.claude\plans\iterative-hugging-wren.md`) completed 2026-07-16. Phase 0.5 — the backend/database/infrastructure/auth/AI-provider ADRs required before any product code — completed 2026-07-17 (`adr/0002`-`adr/0006`). See [17-phase-status.md](17-phase-status.md) for exact current state and [03-system-architecture.md](03-system-architecture.md) for the resolved architecture.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
