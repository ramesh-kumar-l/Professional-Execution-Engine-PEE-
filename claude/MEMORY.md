# MEMORY.md — Memory Bank Discipline

Operationalizes `SYSTEM_PROMPT.md` §16-19, §30-31, §63, §85.

## Source of truth

Two categories of files exist: the memory bank (`project-memory-bank/`, authoritative project knowledge) and source code (the implementation). The memory bank always takes precedence over conversational history (§16). Never rely on chat history for project status (§77).

## Canonical structure

`project-memory-bank/00-29`, one topic per file, kept small and composable (§17). Full list and per-file purpose: `project-memory-bank/README.md`.

Two files act as the project's compressed "save state" and must be current at the end of any major feature:

- **`18-current-state.md`** — "implementation status": what's actually built right now.
- **`19-active-work.md`** — "active context": what's in flight, current phase/epic/feature/task, blockers.

A new session (or a new Claude instance with zero conversation history) must be able to read these two files plus `29-next-task.md` and know exactly where things stand.

## Loading order (§19)

1. `00-project-vision.md`
2. `17-phase-status.md`
3. `18-current-state.md`
4. `19-active-work.md`
5. `29-next-task.md`
6. Relevant architecture documents only — not all of them.

Only after these are reviewed should code inspection begin (§19, §20).

## What to update, and when (§30)

Whenever significant work completes, update:

- `17-phase-status.md`
- `18-current-state.md`
- `19-active-work.md`
- `21-decision-log.md`
- `29-next-task.md`

## Decision logging (§85)

Every meaningful engineering decision goes in `21-decision-log.md`: decision, reason, alternatives considered, expected impact, implementation phase, affected modules. Major architectural decisions additionally get a full ADR (`adr/`, see §27).

## Session handoff (§31)

End every session with a handoff covering: current phase, completed work, pending work, known issues, open decisions, recommended next task, expected memory-bank files to load next. Write it to `project-memory-bank/28-session-handoff.md` and `29-next-task.md`; `session/session-handoff.md` holds the live draft during the session.

## AI memory discipline (§63)

1. Read the required memory-bank files.
2. Build an internal understanding.
3. Inspect only the required source files.
4. Implement.
5. Update the memory bank.
