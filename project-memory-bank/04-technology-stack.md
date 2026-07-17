# 04 — Technology Stack

## Pinned (per `SYSTEM_PROMPT.md` §95, `System_Prompt/Part6.md`)

**Frontend:** React, TypeScript, Next.js, Tailwind CSS, a component library built from reusable primitives. State management stays simple and predictable; prefer server-driven data; avoid unnecessary global state.

## Resolved via Phase-0.5 ADRs (2026-07-17)

| Layer | Choice | ADR |
|---|---|---|
| Backend language/framework | TypeScript, Node.js, NestJS — modular monolith, one Nest module per `/services` entry | [adr/0002](../adr/0002-backend-language-and-service-boundaries.md) |
| Database (server) | PostgreSQL, via Prisma ORM | [adr/0003](../adr/0003-database-and-local-first-storage.md) |
| Local storage (client) | SQLite (embedded), sync protocol deferred to when offline is first required | [adr/0003](../adr/0003-database-and-local-first-storage.md) |
| Infrastructure / hosting | Docker + docker-compose (dev), single containerized deployment (early prod), Kubernetes/Terraform deferred until justified, GitHub Actions for CI/CD | [adr/0004](../adr/0004-infrastructure-and-hosting.md) |
| Auth provider | First-party NestJS `auth` module (system of record) + Auth.js (NextAuth) on the frontend; JWT sessions; OIDC/SAML SSO added later without redesign | [adr/0005](../adr/0005-authentication-strategy.md) |
| AI/LLM provider(s) | First-party `AIProvider` interface; Anthropic Claude first, OpenAI second (proves the abstraction) | [adr/0006](../adr/0006-ai-llm-provider-abstraction.md) |

These were deliberately left TBD during EOS bootstrap (Groups 0-12) per the "decisions require an ADR, not assumption" rule (§27), and resolved as a batch of five ADRs once Phase 0.5 (Architecture ADR) began. See `21-decision-log.md` for the 2026-07-17 entries and `22-architecture-decisions.md` for the full ADR index.
