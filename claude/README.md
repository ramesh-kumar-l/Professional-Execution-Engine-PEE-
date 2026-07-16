# claude/ — Runtime Operating Documents

Prose documents defining *how* Claude operates while building the Professional Execution Engine. These are procedures, not project knowledge — project knowledge lives in `project-memory-bank/`.

**When to load:** `STARTUP.md` at the start of every session, always. The others only when the current task touches their domain (e.g. load `FRONTEND.md` only for UI work).

**When to update:** when the operating procedure itself changes — not for routine project updates (those go to `project-memory-bank/` or `session/`).

## Contents

- `STARTUP.md` — session bootstrap sequence.
- `EXECUTION.md` — the phase/epic/feature/task lifecycle and stop rules.
- `MEMORY.md` — memory bank read/write discipline.
- `FRONTEND.md` — frontend engineering standards.
- `BACKEND.md` — backend engineering standards.
- `TESTING.md` — testing strategy and pyramid.
- `SECURITY.md` — security requirements.
- `RELEASE.md` — release process.
- `CODE_REVIEW.md` — review standards.
- `DOCUMENTATION.md` — documentation standards.

Cross-references: `SYSTEM_PROMPT.md` (`System_Prompt/Part1-6.md`) is the source these documents operationalize. `docs/standards/` covers topics not owned by any file here (API, database, performance, observability, git/CI).
