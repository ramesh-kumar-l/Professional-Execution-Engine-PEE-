# project-memory-bank/ — Authoritative Project Memory

The single source of truth for project knowledge: vision, architecture, decisions, current state, active work. Takes precedence over conversational history (`SYSTEM_PROMPT.md` §16, §63).

**When to load:** per task, following the priority order in `SYSTEM_PROMPT.md` §19 — `00-project-vision.md` → `17-phase-status.md` → `18-current-state.md` → `19-active-work.md` → `29-next-task.md` → relevant architecture docs. Never load the whole folder speculatively.

**When to update:** after any significant work, per `SYSTEM_PROMPT.md` §30 — at minimum `17-phase-status.md`, `18-current-state.md`, `19-active-work.md`, `21-decision-log.md`, `29-next-task.md`.

## Contents

`00`–`29`, one focused file per topic (vision, principles, PRD, architecture, stack, standards, frontend/backend guidelines, AI architecture, database, API, security, testing, observability, deployment, roadmap, phase/current-state/active-work tracking, known issues, decision log, ADR index, UI design system, component library, performance goals, release plan, backlog, session handoff, next task). See each file's own header for its specific purpose and update triggers.

Cross-references: `adr/` for the detailed record behind any entry in `21-decision-log.md`. `session/` for moment-to-moment session state (lighter-weight than `28-session-handoff.md`, which captures only the final handoff of a session).
