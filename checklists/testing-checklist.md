# Testing Checklist

Source: `SYSTEM_PROMPT.md` §47-49, `claude/TESTING.md`.

- ☐ Unit tests cover core logic (~70% of suite)
- ☐ Integration tests cover cross-module behavior (~20%)
- ☐ End-to-end tests cover critical workflows (~10%)
- ☐ Edge cases and failure scenarios covered, not just happy path
- ☐ Regression test added for any bug fix
- ☐ Tests are deterministic (no flakiness, no uncontrolled time/order dependence)
- ☐ All tests passing before marking task complete
- ☐ Acceptance criteria from the task spec are each covered by a test or explicit verification step
