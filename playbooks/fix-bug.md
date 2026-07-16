# Playbook: Fix Bug

Invoked by `/fix-bug`. Source: `SYSTEM_PROMPT.md` §20-21, §41, §47 (`claude/EXECUTION.md`, `claude/TESTING.md`).

## Inputs

Bug report: observed behavior, expected behavior, reproduction steps.

## Required memory bank

`18-current-state.md`, `19-active-work.md`, `20-known-issues.md` (check if already tracked), the specific architecture/API file covering the affected module.

## Steps

1. Reproduce the bug. Trace the root cause by inspecting only the directly implicated code (§20) — never scan unrelated files.
2. Write a regression test that fails on the current code before fixing anything.
3. Fix with the minimal change that addresses the root cause. Do not perform incidental refactors alongside the fix (`claude/CODE_REVIEW.md`) unless the refactor is the fix.
4. Confirm the regression test now passes and existing tests are unaffected.
5. Check error handling and logging around the failure per `claude/BACKEND.md` §41-42.

## Outputs

Fix + regression test. If the bug was already tracked in `20-known-issues.md`, remove or update that entry.

## Validation

Regression test passes; full relevant test suite passes; no new errors introduced.

## Completion criteria

Task completion report (files modified, tests executed, root cause, memory-bank updates). Stop for approval.
