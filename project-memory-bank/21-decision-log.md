# 21 — Decision Log

Source of truth for process: `SYSTEM_PROMPT.md` §85 (`System_Prompt/Part5.md`). Major architectural decisions additionally get a full ADR in `adr/` (§27) — this log covers all meaningful engineering decisions, including smaller ones that don't warrant a full ADR.

## 2026-07-16 — Adopt the Engineering Operating System bootstrap

**Decision:** Build the full EOS scaffold (`claude/`, memory bank, ADRs, playbooks, templates, checklists, design system, standards, session/dashboard tracking) before any PEE product code, per `EngineeringOperatingSystem.md`.
**Alternatives considered:** Skip scaffolding and start product code directly using only `SYSTEM_PROMPT.md` as guidance.
**Reason:** `EngineeringOperatingSystem.md` explicitly mandates this sequencing; the user confirmed it when asked whether to finish EOS scaffolding first or jump to product code.
**Impact:** Phase 0 (Foundation) now consists of two parts — EOS bootstrap, then real Phase-0 architecture work. See [16-roadmap.md](16-roadmap.md).
**Phase:** 0. **Modules affected:** none (documentation only).

## 2026-07-16 — Approval cadence: stop per logical group

**Decision:** Generate the EOS in 13 groups (Group 0-12), stopping for user approval after each, rather than one file at a time or as a single dump.
**Alternatives considered:** Literal one-artifact-at-a-time (90+ approval round-trips); single full-repo dump (violates the bootstrap spec's explicit prohibition).
**Reason:** User confirmed as a practical middle ground during plan approval.
**Impact:** Governs the execution rhythm of Phase 0. **Phase:** 0.

## 2026-07-16 — Functional slash-commands, not just prose

**Decision:** Playbooks are mirrored as real, invocable `.claude/commands/*.md` slash-commands; `claude/` (no dot) holds prose operating docs; root `commands/` is a thin pointer doc.
**Alternatives considered:** Prose-only `commands/` folder with no functional wiring.
**Reason:** User confirmed real functionality was wanted, not just documentation, while avoiding duplicate-purpose folders.
**Impact:** Group 5 of the EOS plan. **Phase:** 0.

## 2026-07-16 — Tech stack: template + TBD

**Decision:** Pin only the frontend stack already specified in `SYSTEM_PROMPT.md` §95 (React/TypeScript/Next.js/Tailwind). Leave backend, database, and infrastructure explicitly TBD, to be resolved via ADR when real Phase 0 product work begins.
**Alternatives considered:** Force a concrete backend/DB/infra choice now during scaffolding.
**Reason:** User confirmed; avoids an unjustified architectural decision before any product requirements exist (§27 — major decisions need an ADR, not an assumption).
**Impact:** [04-technology-stack.md](04-technology-stack.md) carries an explicit TBD table. **Phase:** 0.

## 2026-07-16 — Strict file-size modularity (300 lines)

**Decision:** All implementation files (backend and frontend) target under ~300 lines, split by responsibility rather than allowed to grow.
**Alternatives considered:** No explicit size convention (rely on judgment alone).
**Reason:** User's standing instruction — keeps future sessions' token cost low by letting them load only the specific file relevant to a task.
**Impact:** Recorded in `claude/BACKEND.md`, `claude/FRONTEND.md`, [06-coding-standards.md](06-coding-standards.md). **Phase:** applies from Phase 0 onward, all product code.
