# ADR-0002: Backend Language, Framework, and Service Boundaries

- **Status:** Accepted
- **Date:** 2026-07-17
- **Phase:** 0.5 (Foundation — Architecture ADR)

## Problem

`04-technology-stack.md` and `03-system-architecture.md` leave the backend language, framework, and service-boundary strategy TBD. Phase 1 (Authentication) cannot be scoped, and no `/services` code can be written, until this is resolved. The choice must support the long-term architecture goal (§10): scale from a single individual to enterprise teams, across web/desktop/mobile, without a rewrite.

## Context

- Frontend is pinned: React, TypeScript, Next.js, Tailwind (§95, `04-technology-stack.md`).
- Repo shape (§36) reserves `/services` for api, auth, memory, execution, planning, analytics, notifications.
- Principle 8 (Sustainable Complexity, `01-product-principles.md`): complexity grows only when justified.
- `System_Prompt/Part3.md` §37 (Part3.md:44): "small modules over monoliths" as a code-organization rule, not necessarily a deployment-topology mandate.
- No AI/ML training or heavy numerical workloads run inside our own backend — LLM inference happens at the provider (ADR-0006); this removes the usual argument for a Python backend.

## Options Considered

1. **TypeScript/Node.js (NestJS), modular monolith.** One language across frontend and backend; shared types via `/packages/types`; NestJS's module/DI system gives real internal boundaries (one Nest module per `/services` entry) without operating N deployables from day one.
2. **Python (FastAPI), modular monolith.** Strong AI/data ecosystem, but this project calls out to LLM provider APIs rather than running models locally, so the ecosystem advantage doesn't apply; introduces a second language, splitting shared types and tooling from the frontend.
3. **Go, modular monolith.** Excellent concurrency and performance; weaker fit for a small team's velocity, weaker first-party LLM SDK support, and no type sharing with the Next.js frontend.
4. **Microservices from day one** (any language, one deployable per `/services` entry). Matches the repo-shape list literally, but violates Sustainable Complexity — no current load, team size, or scaling data justifies independent deployability yet.

## Decision

**Option 1.** Backend is TypeScript on Node.js, using **NestJS**, deployed as a **modular monolith**: one deployable service, internally organized into Nest modules mapped 1:1 to the `/services` list (`api`, `auth`, `memory`, `execution`, `planning`, `analytics`, `notifications`). Each module owns its own data access and exposes a defined service interface — no module reaches directly into another module's repository/database layer. This preserves the option to extract any module into an independently deployed service later (per §10, "without architectural redesign") because the boundary already exists in code; extraction becomes a deployment change, not a design change.

Shared request/response and domain types live in `/packages/types` and are consumed by both the Next.js frontend and the NestJS backend, eliminating drift between API contract and client.

## Trade-offs

Gained: single-language stack (lower context-switching cost, one hiring/tooling profile, shared types), fast iteration, clear extraction seams for future scale. Given up: no independent scaling or deployment of individual domains (e.g., `execution` can't be scaled separately from `auth`) until/unless a module is actually extracted — acceptable because no current requirement demands it.

## Migration Impact

None yet — no backend code exists. Establishes the pattern all future `/services` (really: Nest modules) and `/packages` code must follow.

## Alternatives Rejected

Option 2 (Python/FastAPI) rejected: the assumed AI-ecosystem advantage doesn't apply since inference is provider-hosted (ADR-0006), and it costs a second language boundary against a TypeScript frontend. Option 3 (Go) rejected: no current performance bottleneck justifies its steeper velocity cost for this team size, and it forfeits type sharing with the frontend. Option 4 (microservices-first) rejected per Principle 8 — premature operational complexity (N deployables, N sets of infra, inter-service network calls) with no corresponding requirement yet; revisit if/when a specific module demonstrably needs independent scaling.

## Memory Bank Reference

`project-memory-bank/03-system-architecture.md`, `04-technology-stack.md`.
