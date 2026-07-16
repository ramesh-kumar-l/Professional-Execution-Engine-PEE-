# 04 — Technology Stack

## Pinned (per `SYSTEM_PROMPT.md` §95, `System_Prompt/Part6.md`)

**Frontend:** React, TypeScript, Next.js, Tailwind CSS, a component library built from reusable primitives. State management stays simple and predictable; prefer server-driven data; avoid unnecessary global state.

## TBD — resolved via Phase-0 ADR before implementation

| Layer | Status | Notes |
|---|---|---|
| Backend language/runtime | TBD | Not specified in SYSTEM_PROMPT.md |
| Database | TBD | Only principles pinned (§39) — see [10-database-design.md](10-database-design.md) |
| Infrastructure / hosting | TBD | `/infrastructure` reserves docker, kubernetes, terraform (§36) as candidates, not decisions |
| AI/LLM provider(s) | TBD | Must support multiple providers per §10 long-term architecture goal |
| Auth provider | TBD | |

This is a deliberate decision, confirmed with the user during EOS bootstrap: forcing a premature backend/DB/infra choice during scaffolding would violate the "decisions require an ADR, not assumption" rule (§27). Resolve each TBD as a numbered ADR in `adr/` when Phase 0 product work begins, then update this table.
