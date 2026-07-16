# 03 — System Architecture

**Status: TBD — no concrete architecture decided yet.** This file will be filled in and kept current once Phase 0 implementation begins; a major architecture decision requires an ADR (`adr/`, SYSTEM_PROMPT §27) before this file is updated.

## Long-term architecture goals (§10, `System_Prompt/Part1.md`)

The architecture must support, without requiring rewrites: personal usage, team collaboration, enterprise deployment, offline operation, cloud synchronization, AI agents, multiple LLM providers, a plugin ecosystem, public APIs, and mobile/desktop/web clients.

## Repository shape (§36, `System_Prompt/Part3.md`)

```
/apps            web, desktop, mobile
/services        api, auth, memory, execution, planning, analytics, notifications
/packages        sdk, ui, design-system, shared, config, types, utils
/infrastructure  docker, kubernetes, terraform, github
/docs
/project-memory-bank
/tests
/scripts
/tools
```

Avoid deep nesting; keep clear module boundaries (§36-37, see `claude/BACKEND.md`).

## Open questions (to be resolved via ADR before Phase 0 coding starts)

- Backend language/runtime
- Service boundaries for the `/services` list above (monolith-first vs. split-from-start)
- Sync/offline architecture for the Local-First principle ([01-product-principles.md](01-product-principles.md) Principle 2)
- Multi-LLM-provider abstraction approach

Record the resolution as `adr/0002-*` (or next available number) once decided, and update this file to reference it.
