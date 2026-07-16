# 08 — Backend Guidelines

Operational standards live in `claude/BACKEND.md` — not duplicated here. This file tracks the *product-specific* backend state.

## Current state

**Status: TBD.** No backend implementation exists yet (Phase 0 = EOS bootstrap, no product code). Backend language/runtime is an open decision — see [04-technology-stack.md](04-technology-stack.md) and [03-system-architecture.md](03-system-architecture.md).

## What goes here once backend work starts

- Actual service boundaries under `/services` (api, auth, memory, execution, planning, analytics, notifications) and what each owns
- Product-specific module map and their public interfaces
- Links to the API contract once one exists — see [11-api-contract.md](11-api-contract.md)

Do not duplicate general API/error-handling/config standards here — those live in `claude/BACKEND.md`.
