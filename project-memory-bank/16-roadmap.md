# 16 — Roadmap

Source of truth: `SYSTEM_PROMPT.md` §22 (`System_Prompt/Part2.md`). Each phase must be independently releasable and deliver measurable value. Work on one phase at a time unless explicitly instructed otherwise.

## Product phases (§22)

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | **In progress** — Engineering Operating System bootstrap (this repo's current work) |
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

## Current sub-phase: EOS bootstrap groups

Phase 0 itself is being built incrementally per `C:\Users\Ramesh\.claude\plans\iterative-hugging-wren.md` (Group 0-12: skeleton, runtime docs, memory bank, ADRs, playbooks, commands, templates, checklists, design system, standards, session mgmt, dashboard, evaluation). See [17-phase-status.md](17-phase-status.md) for exact current group.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
