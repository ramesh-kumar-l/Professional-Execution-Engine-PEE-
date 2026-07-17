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

## 2026-07-17 — Backend: TypeScript/NestJS modular monolith

**Decision:** Backend is TypeScript on Node.js (NestJS), deployed as a single modular monolith; one Nest module per `/services` entry, each owning its own data access.
**Alternatives considered:** Python/FastAPI, Go, microservices from day one.
**Reason:** Single-language stack with the Next.js frontend (shared types), no current workload justifies a second language or independent-service operations. Full rationale: [adr/0002](../adr/0002-backend-language-and-service-boundaries.md).
**Impact:** [03-system-architecture.md](03-system-architecture.md), [04-technology-stack.md](04-technology-stack.md). **Phase:** 0.5.

## 2026-07-17 — Storage: Postgres + SQLite, sync deferred

**Decision:** PostgreSQL (server, via Prisma) is the source of truth; SQLite is each client's local store; sync protocol design is deferred, but every syncable table gets a UUID primary key and an `updated_at`/version column from the start.
**Alternatives considered:** Postgres-only (online-only), CRDT-first, MongoDB.
**Reason:** Unblocks schema work now while keeping the Local-First offline path open without a future schema rewrite. Full rationale: [adr/0003](../adr/0003-database-and-local-first-storage.md).
**Impact:** [10-database-design.md](10-database-design.md). **Phase:** 0.5.

## 2026-07-17 — Infrastructure: Docker now, Kubernetes deferred

**Decision:** Docker + docker-compose for dev, single containerized deployment for early production, GitHub Actions for CI/CD; Kubernetes and Terraform deferred until a demonstrated need exists.
**Alternatives considered:** Kubernetes from day one, fully serverless backend.
**Reason:** No current service count or load justifies orchestration complexity (Sustainable Complexity, Principle 8). Full rationale: [adr/0004](../adr/0004-infrastructure-and-hosting.md).
**Impact:** [04-technology-stack.md](04-technology-stack.md), `docs/standards/ci-cd.md`. **Phase:** 0.5.

## 2026-07-17 — Auth: first-party module + Auth.js, JWT sessions

**Decision:** NestJS `auth` module is the system of record for users/credentials; Auth.js (NextAuth) drives frontend login; JWT + refresh-token sessions; enterprise SSO added later as an additive provider.
**Alternatives considered:** Third-party auth-as-a-service, fully custom auth stack.
**Reason:** Keeps identity data in our own database (Local-First, self-hosted enterprise deployment) while reusing a maintained library for security-critical flows. Full rationale: [adr/0005](../adr/0005-authentication-strategy.md).
**Impact:** [12-security.md](12-security.md), [04-technology-stack.md](04-technology-stack.md). **Phase:** 0.5.

## 2026-07-17 — AI: first-party provider interface, Claude + OpenAI

**Decision:** A first-party `AIProvider` interface abstracts all LLM calls; Anthropic Claude is the first implementation, OpenAI the second (to prove the abstraction generalizes) — no feature code calls a vendor SDK directly.
**Alternatives considered:** Direct vendor SDK integration, third-party orchestration framework.
**Reason:** §10 requires multi-provider support without a rewrite; Explainable AI fields (§100) are enforced structurally at the interface. Full rationale: [adr/0006](../adr/0006-ai-llm-provider-abstraction.md).
**Impact:** [09-ai-architecture.md](09-ai-architecture.md), [04-technology-stack.md](04-technology-stack.md). **Phase:** 0.5.
