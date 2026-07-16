# EXECUTION.md — The Execution Loop

Operationalizes `SYSTEM_PROMPT.md` §22-31, §61, §66-67, §70-81.

## Work hierarchy (§71)

```
Project → Phase → Epic → Feature → Task → Subtask → Implementation Unit
```

An Implementation Unit should normally fit in one session. If a task is estimated larger than "L" (§84: XS/S/M/L/XL/XXL), decompose it before coding.

## Phase lifecycle (§23, §70)

```
Understand → Review Memory Bank → Review Current Architecture → Design →
Validate Design → Implement → Test → Document → Update Memory Bank → Stop
```

Never automatically begin the next phase (§22, §24).

## Before writing any code (§26, §61, §74)

Produce a short written plan:

- **Goal** — what problem is being solved
- **Current state** — what already exists (Reuse → Extend → Refactor → Replace, §21)
- **Dependencies** — modules involved (§76 dependency graph — don't build a dependent feature before its prerequisite is done)
- **Design** — how it integrates
- **Risks** — what could break
- **Testing** — how success is validated
- **Acceptance criteria** — measurable completion conditions (§75)
- **Memory-bank files to update** (§74)

Only after the plan is written should implementation begin.

## Escalate instead of guessing (§66)

Pause and ask the user if: requirements conflict, architecture is ambiguous, multiple valid approaches have significant trade-offs, the change would break compatibility, security implications are unclear, or intent is uncertain. Do not make irreversible architectural decisions unilaterally.

## Scope discipline (§67, §78)

Implement only what belongs to the current task. Ideas outside scope go into `project-memory-bank/27-backlog.md` (title, description, reason, priority, dependencies, estimated value) — do not let them interrupt current work.

## Task completion report (§80)

When a task finishes, report: task completed, files modified, tests executed, documentation updated, architectural changes, known limitations, suggested next task, memory-bank files updated. Then wait for approval.

## Phase completion report (§81)

When a phase finishes, report: phase summary, implemented capabilities, architecture updates, performance considerations, security review, testing summary, documentation summary, known issues, technical debt, future improvements, recommended next phase. Then wait for approval — never auto-start the next phase.

## Mandatory Stop Rule (§24)

After every phase and every task: stop, present the report above, and wait for explicit approval. Never assume permission to continue.

## Session Completion Checklist (§87)

Before ending any session, verify:

```
✓ Code complete          ✓ ADRs updated (if needed)
✓ Tests passing          ✓ Risks documented
✓ Documentation updated  ✓ Backlog updated
✓ Memory bank updated    ✓ Next task identified
                          ✓ Session handoff written
```

## Technical debt (§83)

Allowed only when documented, justified, tracked, prioritized, and time-bounded. Every debt item needs: reason, impact, mitigation, removal strategy, expected removal milestone. Never accumulate undocumented debt.
