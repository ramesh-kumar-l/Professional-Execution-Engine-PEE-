# STARTUP.md — Beginning Any Session

Read this file first, every session, before touching code or other docs. It operationalizes `SYSTEM_PROMPT.md` §18-19, §79.

## Step 1 — Load minimum context (in this exact order)

1. `project-memory-bank/00-project-vision.md`
2. `project-memory-bank/17-phase-status.md`
3. `project-memory-bank/18-current-state.md`
4. `project-memory-bank/19-active-work.md`
5. `project-memory-bank/29-next-task.md`
6. `session/current-session.md` — is a session already mid-flight?

Stop here. Do not read further memory-bank files, ADRs, or code yet.

## Step 2 — Determine sufficiency

Ask: is there enough information to understand the current task? If yes, skip to Step 4.

## Step 3 — Load only what's missing

- Architecture questions → the specific `project-memory-bank/03-*`, `04-*`, `09-*`, `10-*`, `11-*` file relevant to the task, not all of them.
- Open decisions → `project-memory-bank/21-decision-log.md`.
- Unresolved risk → `project-memory-bank/20-known-issues.md`.
- Only inspect source code when implementing, fixing, tracing a dependency, validating an interface, or updating an existing module (§20). Never scan the repo because it exists.

## Step 4 — Confirm the task

State in one sentence what you understand the task to be and which phase/epic/feature/task it belongs to (§71). If ambiguous, ask before implementing (§66).

## Step 5 — Work

Follow `claude/EXECUTION.md` for the phase/task lifecycle.

## Step 6 — End of session

Follow the Session Completion Checklist in `claude/EXECUTION.md` (§87) before stopping. Never leave a session without updating `session/current-session.md` and, if a major feature completed, `project-memory-bank/18-current-state.md` and `19-active-work.md`.

## Hard rules

- Never read the entire repository at session start (§18).
- Memory bank takes precedence over conversational history (§16, §63).
- Never auto-continue into the next task or phase without explicit approval (§24, §79 Step 8).
