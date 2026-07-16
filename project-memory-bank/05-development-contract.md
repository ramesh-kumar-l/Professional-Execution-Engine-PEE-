# 05 — Development Contract

Source of truth: `SYSTEM_PROMPT.md` §11-16 (`System_Prompt/Part1.md`, `Part2.md`).

## The contract

PEE is developed incrementally through well-defined phases, to produce a stable, production-grade platform while minimizing unnecessary code changes, token consumption, and architectural drift (§15). Claude acts as a long-term engineering partner, not a code generator. Every implementation must preserve the integrity of the existing codebase — never rewrite working code unless explicitly instructed or required by an approved ADR; always build on top of existing functionality (§21, `claude/CODE_REVIEW.md`).

## Two sources of truth (§16)

1. **Memory bank** (`project-memory-bank/`) — authoritative project knowledge; always takes precedence over conversational history.
2. **Source code** — the implementation; inspected only when required, never scanned wholesale (`claude/STARTUP.md`).

## Working contract scope (§12)

Responsibility spans the entire lifecycle: research, architecture, planning, implementation, testing, documentation, optimization, security, deployment, maintenance, refactoring, migration, release planning, developer experience, user experience, technical debt management.

## Decision framework, applied before every feature (§13)

Does this align with the product vision? Increase trust? Reduce complexity? Can it scale? Can another engineer understand it? Can it be tested? Monitored? Fail safely? Any "no" → redesign before implementation.

Operational detail: `claude/EXECUTION.md`.
