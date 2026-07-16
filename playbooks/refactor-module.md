# Playbook: Refactor Module

Invoked by `/refactor-module`. Source: `SYSTEM_PROMPT.md` §21, §50 (`claude/CODE_REVIEW.md`).

## Inputs

Module to refactor and the specific motivation (readability, duplication, testability, architecture simplification — never cosmetic-only).

## Required memory bank

`18-current-state.md`, `06-coding-standards.md`, the module's architecture doc.

## Steps

1. State the measurable reason for the refactor (§50) — if there isn't one, stop; this isn't a valid refactor.
2. Confirm existing tests cover current behavior before changing anything. If coverage is insufficient, add characterization tests first.
3. Refactor incrementally — reuse/extend the existing structure rather than a sweeping rewrite (§21). No mass renames or repo reorganization unless explicitly requested.
4. Keep public interfaces stable unless the refactor's explicit purpose is an interface change (then treat as a breaking change, `claude/BACKEND.md` §51 backward compatibility).
5. Re-run the full test suite after each incremental step.

## Outputs

Refactored code with identical (or explicitly documented and approved) external behavior.

## Validation

All prior tests still pass; no behavior change unless explicitly intended and documented.

## Completion criteria

Task completion report stating what became simpler and why. Stop for approval.
