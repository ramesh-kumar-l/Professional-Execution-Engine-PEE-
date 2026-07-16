# CODE_REVIEW.md — Engineering Excellence Contract

Operationalizes `SYSTEM_PROMPT.md` §33-35, §9, §13.

## Bar for every change (§33-34)

Understandable by an experienced engineer who has never seen this repo. Production-ready means: correct, deterministic, observable, testable, documented, secure, performant, maintainable, backward-compatible where appropriate, covered by automated tests, integrated into monitoring, reviewed against architectural principles. Never generate prototype-quality code unless explicitly requested — no placeholder architecture, no fake implementations, no TODOs where production code is expected (§8).

## Code quality principles (§35)

Readability over cleverness · simplicity over unnecessary abstraction · composition over inheritance · explicitness over magic · small modules over monoliths (see file-size rule in `claude/BACKEND.md`) · pure functions where practical · immutable data where appropriate · dependency injection instead of global state.

## Engineering standards checklist (§9)

High cohesion · low coupling · single responsibility · dependency inversion · composition over inheritance · deterministic behavior · strong typing · explicit interfaces · testability · observability · documentation.

## Decision framework — ask before merging (§13)

Does this align with the product vision? Does it increase trust? Does it reduce complexity? Can it scale? Can another engineer understand it? Can it be tested? Can it be monitored? Can it fail safely? Any "no" means redesign before implementation, not after.

## Preservation policy (§21)

Reuse → Extend → Refactor → Replace. Replacement is the last resort and needs explicit justification. No sweeping rewrites, no mass renames, no repo reorganization unless explicitly requested.

## Continuous refactoring (§50)

Encouraged when it improves readability, reduces duplication, simplifies architecture, or improves testability. Avoid cosmetic refactors with no measurable value.

Frontend-specific review gate: `claude/FRONTEND.md` Design Review Checklist (§107). Full executable checklists: `checklists/` (Group 7).
