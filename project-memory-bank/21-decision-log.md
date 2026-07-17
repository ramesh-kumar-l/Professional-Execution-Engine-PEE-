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

## 2026-07-17 — Phase 1 implementation-level decisions (within adr/0002-0005, not new ADRs)

**Decision (monorepo tool):** npm workspaces, not Turborepo/Nx.
**Reason:** Built into npm; nothing today needs cross-package task caching. Revisit if build times become a real problem.

**Decision (shared DB package):** Prisma schema + `PrismaService` live in a new `/packages/database`, not previously enumerated in `03-system-architecture.md`'s package list.
**Reason:** Every future `/services` module needs DB access; this is a justified, documented addition to that list, not scope creep.

**Decision (token custody — BFF pattern):** the browser never receives a raw JWT. Auth.js holds the access+refresh pair in its own encrypted server-side session; the Next.js server calls the NestJS API directly.
**Reason:** Removes CORS/token-exposure risk entirely for this phase; standard, lowest-risk pattern for a Next.js-front/Nest-API-back pair.

**Decision (refresh tokens are opaque, not JWTs):** refresh tokens are random strings; only their SHA-256 hash is persisted. Rotation revokes the old token and issues a new one; reuse of an already-revoked token revokes the user's entire active chain (`TOKEN_REUSE_DETECTED`).
**Reason:** Makes revocation authoritative in the database instead of waiting on JWT expiry — standard theft-detection pattern.

**Decision (dependency vulnerabilities not force-upgraded):** `npm audit` flagged advisories in the NestJS 10.x/Express and Next.js 14.x chains that only clear via major-version bumps (Nest 11, Next 16).
**Reason:** Force-upgrading mid-feature via `npm audit fix --force` would pull in untested majors without the regression testing such an upgrade deserves; tracked instead in [20-known-issues.md](20-known-issues.md) as a dedicated follow-up.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [20-known-issues.md](20-known-issues.md). **Phase:** 1.

## 2026-07-18 — Phase 2 implementation-level decisions

**Decision (single-owner model, no sharing yet):** every `Project` belongs to exactly one `User` (`ownerId`); there is no multi-user membership/sharing model.
**Alternatives considered:** A `ProjectMember` join table with per-project roles from the start.
**Reason:** Nothing in the Phase 2 exit criteria ("core project data model, CRUD + API contract, Postgres schema") asks for sharing, and no consuming feature exists yet to justify the complexity (Sustainable Complexity, Principle 8). Adding it now would be a guess at a shape that Tasks/collaboration (Phase 3+) might not actually need. Recorded as backlog, not silently dropped.

**Decision (soft delete via archive, not row deletion):** `DELETE /projects/:id` sets `status = ARCHIVED` + `archivedAt`; the row is never removed.
**Reason:** Matches the DB design doc's "soft deletes where appropriate" principle; archived projects stay recoverable and don't break referential integrity if future entities (e.g. Tasks) reference a project.

**Decision (ownership check returns 404, not 403):** `ProjectsService.findOwnedOrThrow` throws `NotFoundException` whether a project doesn't exist or belongs to someone else.
**Reason:** A 403 would confirm the resource exists, letting a caller enumerate other users' project IDs by observing 403-vs-404 responses; 404-for-both closes that side channel.

**Decision (pagination shape):** list responses use `{ data, page, pageSize, total, totalPages }` (`PaginatedResponse<T>` in `@pee/types`), default `page=1`/`pageSize=20`, capped at `pageSize=100`.
**Reason:** Matches `11-api-contract.md`'s governing standard ("pagination, filtering, sorting" on every endpoint that needs it) with a shape reusable by every future list endpoint, not just `/projects`.

**Decision (no per-project audit log yet):** project create/update/archive actions are not recorded anywhere (unlike `AuthAuditLog` for auth events).
**Reason:** Building a general-purpose audit trail now, before any second domain entity exists to validate its shape, would be speculative. Tracked in [20-known-issues.md](20-known-issues.md) and [27-backlog.md](27-backlog.md) rather than silently skipped.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [20-known-issues.md](20-known-issues.md). **Phase:** 2.
