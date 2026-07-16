# docs/ — Standards & Repository Navigation Guide

Two things live here: cross-cutting engineering standards not already owned by a `claude/` runtime doc (`docs/standards/`), and this file — the full navigation guide for the Engineering Operating System (EOS).

## How this repository is organized

Read `CLAUDE.md` first — it's the thin root pointer into everything below.

| Folder | Holds | Load when |
|---|---|---|
| `System_Prompt/Part1-6.md` | `SYSTEM_PROMPT.md` — the product constitution. Never rewritten. | Rarely directly — `claude/` and `project-memory-bank/` already operationalize it with `§NN` references back to it. Read a specific section only when a reference is ambiguous. |
| `claude/` | Prose: *how* Claude operates (session start, execution loop, memory discipline, frontend/backend/testing/security/release/review/documentation standards). | `STARTUP.md` every session; others by domain. |
| `.claude/commands/` | Real, invocable slash-commands (`/implement-feature`, `/fix-bug`, etc.), each a thin wrapper around a playbook. | When running a recurring workflow. |
| `commands/` | One-paragraph pointer to `.claude/commands/`. Not itself functional. | Rarely — orientation only. |
| `project-memory-bank/` | Authoritative project knowledge: vision, principles, architecture, stack, standards pointers, and the live operational trackers (phase status, current state, active work, known issues, decision log, backlog, session handoff, next task). | `00`, `17`, `18`, `19`, `29` every session; others by task, per `claude/STARTUP.md`'s loading order. |
| `adr/` | Architecture Decision Records — major technical decisions, with a template. | When making or reviewing a major architectural decision. |
| `playbooks/` | Step-by-step procedures for recurring engineering workflows (the source each `.claude/commands/` file wraps). | When running that workflow, or writing a new command. |
| `templates/` | Reusable document shapes (feature spec, epic, task, API design, ADR is separate in `adr/`, release notes, postmortem, etc.). | When writing a new instance of that document type. |
| `checklists/` | Executable review checklists (architecture, security, accessibility, performance, testing, frontend, backend, documentation, release). | Before accepting any implementation in that domain. |
| `design-system/` | Full written UI design specification (tokens, layout/nav, components, states, accessibility/themes, interaction principles). | Before any frontend implementation work. |
| `docs/standards/` | Cross-cutting standards not owned by a `claude/` doc: API design, database, performance, observability/logging, git/branching/releases, CI/CD, developer experience. | When the task touches one of those topics specifically. |
| `session/` | Live, moment-to-moment session state (current session, today's plan, completed, next task, handoff draft). | `current-session.md` at session start; updated continuously. |
| `dashboard/` | Human-scannable project health snapshot (status, roadmap, risks, blockers, milestones, metrics). | When asked for project status, or starting a new phase. |
| `evaluation/` | Quality bar for AI-native features. | When implementing or reviewing any AI-driven feature. |

## Where a specific question goes

- *"What are we building and why?"* → `project-memory-bank/00-project-vision.md`, `01-product-principles.md`.
- *"What's the current state of the project?"* → `dashboard/STATUS.md` (human summary) or `project-memory-bank/17-19` (detail).
- *"How do I start a session?"* → `claude/STARTUP.md`.
- *"How do I implement a feature / fix a bug / build an API / ...?"* → `playbooks/` (or the matching `/command`).
- *"Why was X decided this way?"* → `project-memory-bank/21-decision-log.md` for smaller decisions, `adr/` for major architectural ones.
- *"What should a new document of type Y look like?"* → `templates/`.
- *"Is this implementation good enough to ship?"* → the matching `checklists/*.md`.
- *"What does the UI need to look like?"* → `design-system/`.
- *"What are the rules for [API/DB/CI/git/...]"?* → `docs/standards/`.

## Anti-duplication rule

Every file above cross-references rather than restates. If you're about to write something that already exists in another folder, link to it instead. When in doubt, search before writing (`grep`/`Grep` across `project-memory-bank/`, `claude/`, `docs/standards/` for the topic first).
