# 18 — Current State

**Priority 3 load** — read every session (`claude/STARTUP.md`). This is the "implementation status" save-state file.

## What exists in the repo right now

The full Engineering Operating System, complete:

- `CLAUDE.md` — root entry-point pointer.
- `System_Prompt/Part1-6.md` — the product constitution (`SYSTEM_PROMPT.md`), untouched.
- `EngineeringOperatingSystem.md` — the bootstrap instruction, untouched.
- `claude/` — 10 runtime docs (STARTUP, EXECUTION, MEMORY, FRONTEND, BACKEND, TESTING, SECURITY, RELEASE, CODE_REVIEW, DOCUMENTATION) + README.
- `.claude/commands/` — 9 functional slash-commands (`/implement-feature`, `/fix-bug`, `/create-api`, `/refactor-module`, `/performance-review`, `/security-review`, `/release`, `/frontend-workflow`, `/backend-workflow`), each wrapping the matching playbook.
- `commands/` — pointer doc to `.claude/commands/`.
- `project-memory-bank/` — all 30 files (00-29) + README. Vision/principles/contract content summarized from SYSTEM_PROMPT.md with `§NN` references; architecture/stack/DB/API/AI files now reflect resolved decisions (see below); operational trackers (17-21, 27-29) reflect real state.
- `adr/` — template + ADR-0001 (adopting the EOS itself) + ADR-0002 through 0006 (backend, database, infrastructure, auth, AI-provider decisions).
- `playbooks/` — 9 workflow procedures.
- `templates/` — 13 reusable document shapes.
- `checklists/` — 9 executable review checklists.
- `design-system/` — 6 spec files (tokens, layout/nav, components, states, accessibility/themes, interaction principles) — categories and rules defined, concrete values TBD until first frontend work.
- `docs/standards/` — 7 cross-cutting standards files (API, database, performance, observability, git/releases, CI/CD, dev experience).
- `docs/README.md` — full repo navigation guide.
- `session/` — 5 live session-tracking files.
- `dashboard/` — 6 human-facing status files.
- `evaluation/` — AI feature quality bar (`ai-feature-quality-bar.md`).

## What does not exist yet

- No product source code of any kind (no `/apps`, `/services`, `/packages`, `/infrastructure`) — the stack to build it with is now decided, but nothing has been implemented.
- No CI/CD pipeline configured yet (tool chosen — GitHub Actions, `adr/0004` — pipeline itself not built).
- No design tokens or components with concrete values (categories/rules only).
- No schema, no auth code, no AI integration code — all await Phase 1+ implementation against the now-resolved architecture.

## Architecture

**Resolved 2026-07-17, not yet implemented.** Backend: TypeScript/NestJS modular monolith. Storage: PostgreSQL + SQLite (local), Prisma. Infra: Docker/docker-compose, GitHub Actions, K8s/Terraform deferred. Auth: first-party NestJS module + Auth.js, JWT sessions. AI: first-party provider interface, Claude + OpenAI. Full detail and rationale: [03-system-architecture.md](03-system-architecture.md) and `adr/0002`-`adr/0006`.
