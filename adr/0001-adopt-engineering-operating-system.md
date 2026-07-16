# ADR-0001: Adopt the Engineering Operating System Before Product Code

- **Status:** Accepted
- **Date:** 2026-07-16
- **Phase:** 0 (Foundation)

## Problem

`SYSTEM_PROMPT.md` establishes the product constitution for the Professional Execution Engine, but nothing in the repo defined *how* Claude should operate across many months of sessions — how to load context cheaply, where project knowledge lives, how decisions get recorded, or how work gets decomposed and checkpointed. Without that, long-running development risks context loss, duplicated documents, and architectural drift.

## Context

The repo contained only `README.md`, `EngineeringOperatingSystem.md` (a one-time bootstrap instruction), and `System_Prompt/Part1-6.md` (the constitution). `EngineeringOperatingSystem.md` explicitly mandates building a full Engineering Operating System (EOS) — folder structure, runtime docs, memory bank, ADRs, playbooks, templates, checklists, design system spec, standards, session/dashboard tracking — before product implementation begins, generated incrementally with approval checkpoints, never as one dump.

## Options Considered

1. **Build the full EOS scaffold first, in 13 approval-gated groups.** Matches the bootstrap spec exactly; front-loads process investment before any product value ships.
2. **Skip scaffolding, start product code directly, referencing `SYSTEM_PROMPT.md` ad hoc.** Faster initial velocity; high risk of context loss and duplicated/contradictory documentation across a multi-month project.
3. **Minimal scaffolding (just `CLAUDE.md` + a few memory-bank files), defer the rest.** Partial compliance with the bootstrap spec; likely to require rework later.

## Decision

Option 1. Build the complete EOS scaffold in 13 groups (Group 0-12), stopping for user approval after each group, before starting Phase 1+ product implementation. This was confirmed directly with the user, who chose to finish scaffolding first when explicitly asked whether "next phase" meant continuing the EOS build or skipping to product code.

## Trade-offs

Gained: a durable, low-token-cost operating system that lets any future session (with zero conversation history) load only the minimum context needed and continue correctly. Given up: no product code ships during Phase 0 — the entire phase is documentation/scaffolding.

## Migration Impact

None — this is a from-scratch build. Nothing existing was reused, extended, refactored, or replaced; the three governing files (`README.md`, `EngineeringOperatingSystem.md`, `System_Prompt/Part1-6.md`) are untouched.

## Alternatives Rejected

Option 2 was rejected because it directly contradicts `EngineeringOperatingSystem.md`'s explicit sequencing requirement and would risk the exact context-loss problem the EOS exists to prevent. Option 3 was rejected because partial scaffolding would likely need revisiting once real gaps surfaced mid-implementation, costing more total effort than doing it once, completely, up front.

## Memory Bank Reference

`project-memory-bank/16-roadmap.md` (Phase 0 definition), `17-phase-status.md` (group tracking), `21-decision-log.md` (2026-07-16 entries).
