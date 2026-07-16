# Playbook: Implement Feature

Invoked by `/implement-feature`. Source: `SYSTEM_PROMPT.md` §61, §70, §73-75, §80 (`claude/EXECUTION.md`).

## Inputs

Feature description or reference to a PRD entry (`project-memory-bank/02-prd.md`).

## Required memory bank

`00-project-vision.md`, `17-phase-status.md`, `18-current-state.md`, `19-active-work.md`, relevant architecture file(s) (`03-*`, `04-*`, `07-*`/`08-*`, `10-*`, `11-*` as applicable).

## Steps

1. Confirm the feature aligns with product vision and current phase (`01-product-principles.md`, `16-roadmap.md`). Escalate if scope or intent is ambiguous.
2. Write the feature plan: objective, current state, desired state, required APIs, database impact, UI impact, AI impact, testing strategy, migration requirements, observability impact, security considerations, documentation updates (§73).
3. Define acceptance criteria (§75).
4. Reuse → Extend → Refactor → Replace, in that order (§21). Inspect only the code files required.
5. Implement, following `claude/BACKEND.md` / `claude/FRONTEND.md` as applicable, keeping files under ~300 lines.
6. Write tests per `claude/TESTING.md` (70/20/10 pyramid).
7. Update affected documentation and memory-bank files.

## Outputs

Working, tested code; updated `18-current-state.md`, `19-active-work.md`, `21-decision-log.md` if a notable decision was made.

## Validation

All acceptance criteria met; tests passing; `claude/CODE_REVIEW.md` bar satisfied.

## Completion criteria

Task completion report produced (§80): task completed, files modified, tests executed, documentation updated, architectural changes, known limitations, suggested next task, memory-bank files updated. Then stop for approval.
