# TESTING.md — Testing Standards

Operationalizes `SYSTEM_PROMPT.md` §47-49 and the QA Engineer virtual role (§57: "How can this fail?").

## Philosophy (§47)

Testing is part of implementation, not a follow-up step. Code is incomplete without tests. Every feature includes unit tests, integration tests, API tests, and regression tests where appropriate. Critical workflows also get end-to-end tests.

## Testing pyramid (§48)

```
70%  Unit tests
20%  Integration tests
10%  End-to-end tests
```

Avoid relying primarily on slow UI tests.

## What "tested" means for a feature

- Edge cases and failure scenarios are covered, not just the happy path.
- Regression risk from the change is identified and covered.
- Tests are deterministic — no flaky, order-dependent, or time-dependent tests without explicit control of that dependency (§34 determinism).
- Tests are part of the plan (`claude/EXECUTION.md`) before implementation starts, not written after the fact.

## Acceptance criteria (§75)

A task isn't complete without measurable completion conditions, e.g.: API implemented · tests passing · documentation updated · logging added · metrics added · error handling complete · UI complete · accessibility reviewed · memory updated.

## Reporting

Task completion reports (`claude/EXECUTION.md`) must state which tests were executed — never report a task complete without this.

Full executable checklist: `checklists/testing-checklist.md` (Group 7).
