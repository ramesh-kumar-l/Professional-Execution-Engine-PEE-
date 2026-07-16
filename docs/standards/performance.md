# Performance Standards

Cross-cutting conventions and process. Concrete targets live in `project-memory-bank/25-performance-goals.md`; per-layer guidance in `claude/BACKEND.md` / `claude/FRONTEND.md`. Source: `SYSTEM_PROMPT.md` §44, §101.

## Process

- Never assume performance — measure before and after any change claimed to improve it (`playbooks/performance-review.md`).
- Performance is considered from the start of a feature's design, not retrofitted after launch.
- Any performance target that can't currently be met gets logged in `project-memory-bank/20-known-issues.md` with a mitigation plan, not silently ignored.
- Bundle size, query counts, and latency are treated as regressions when they get measurably worse in a change, even if within target.
