# 03 — System Architecture

**Status: Resolved (Phase 0.5, 2026-07-17).** Backend, storage, infrastructure, auth, and AI-provider decisions are recorded in `adr/0002`-`adr/0006`. This file summarizes the resulting shape; the ADRs are the source of truth for rationale.

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

## Resolved architecture (see ADRs for full rationale)

- **Backend:** TypeScript + Node.js + NestJS, deployed as a single modular monolith. Each `/services` entry (`api`, `auth`, `memory`, `execution`, `planning`, `analytics`, `notifications`) is a Nest module with its own data-access layer — no cross-module reach-through. Extraction to an independent deployable is a later, isolated change, not a redesign. ([adr/0002](../adr/0002-backend-language-and-service-boundaries.md))
- **Storage:** PostgreSQL (server, source of truth, via Prisma) + SQLite (per-client local store). Every syncable table gets a client-generated UUID primary key and an `updated_at`/version column from the start, so offline sync (Local-First, Principle 2) can be added later without a schema rewrite. The sync protocol itself is deferred to whichever phase first requires real offline behavior. ([adr/0003](../adr/0003-database-and-local-first-storage.md))
- **Infrastructure:** Docker + docker-compose for dev; single containerized deployment for early production; Kubernetes and Terraform deferred until a demonstrated need exists; GitHub Actions for CI/CD. ([adr/0004](../adr/0004-infrastructure-and-hosting.md))
- **Auth:** NestJS `auth` module is the system of record for users/credentials; Auth.js (NextAuth) drives frontend login flows; JWT + refresh-token sessions; OIDC/SAML enterprise SSO is an additive provider later, not a redesign. ([adr/0005](../adr/0005-authentication-strategy.md))
- **AI/LLM:** First-party `AIProvider` interface in an `ai` Nest module; Anthropic Claude first, OpenAI second (proves the abstraction generalizes); every AI response carries reason/confidence/context/evidence/alternatives per §100, enforced at the interface. ([adr/0006](../adr/0006-ai-llm-provider-abstraction.md))

## Still open (not blocking Phase 1)

- Exact sync protocol for local SQLite ↔ Postgres reconciliation (deferred to first real offline requirement).
- Multi-tenant/enterprise data-isolation model (deferred to Phase 10).
- Concrete managed-hosting provider for the container (an operational choice at first deploy, not architectural).
