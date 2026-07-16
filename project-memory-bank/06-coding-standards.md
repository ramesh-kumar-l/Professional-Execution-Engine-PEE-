# 06 — Coding Standards

Source of truth: `SYSTEM_PROMPT.md` §9, §33-35, §37 (`System_Prompt/Part1.md`, `Part3.md`). Full operational detail: `claude/CODE_REVIEW.md`, `claude/BACKEND.md`, `claude/FRONTEND.md`.

## Engineering standards (§9)

High cohesion, low coupling, single responsibility, dependency inversion, composition over inheritance, deterministic behavior, strong typing, explicit interfaces, testability, observability, documentation.

## Code quality principles (§35)

Readability over cleverness, simplicity over unnecessary abstraction, composition over inheritance, explicitness over magic, small modules over monoliths, pure functions where practical, immutable data where appropriate, dependency injection instead of global state.

## Strict modularity — file size (project convention)

Keep implementation files under ~300 lines. Split by responsibility (e.g. `calendar_service.py`, `goal_service.py` instead of one large `services.py`) so a future session can load only the file relevant to its task instead of an oversized one. Applies to all backend and frontend source files.

## Comments

Default to none. Add a comment only when the *why* is non-obvious (hidden constraint, workaround, subtle invariant) — never to restate what well-named code already communicates.

## Module design (§37)

Every module exposes a clear public interface, minimal dependencies, independent tests, documentation, configuration, metrics, and logging. Modules should be independently replaceable.
