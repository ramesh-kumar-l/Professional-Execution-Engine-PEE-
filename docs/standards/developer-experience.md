# Developer Experience Standards

Source: `SYSTEM_PROMPT.md` §6 (developer experience as a success metric), §55.

## Principles

- The repository should become easier to understand after every completed task — leave it better than you found it (§55).
- Local setup for a new contributor (human or Claude session) should require reading only `CLAUDE.md` → `claude/STARTUP.md` → the minimum memory-bank files for the task at hand, never the whole repo.
- Scripts/tooling under `/scripts` and `/tools` (once they exist) should be self-documenting — `--help` output or a co-located README, not tribal knowledge.
- Error messages during local development should be actionable, matching the same bar as user-facing errors (`claude/FRONTEND.md`, §104).

## Status

No developer tooling exists yet (no product code). Populate this file with concrete setup/onboarding steps once the first service or app scaffold exists.
