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

## 2026-07-18 — Phase 3 implementation-level decisions

**Decision (Goal/Task nesting model, no separate "Plan" entity):** `Goal` nests under `Project`; `Task` nests under `Goal` and *is* the decomposition/plan — there's no separate `Plan` table between them.
**Alternatives considered:** A distinct `Plan` entity owning the tasks, with `Goal` 1:1 to `Plan`.
**Reason:** A third entity would add a layer with no independent identity or behavior — "the plan" is just the goal's ordered task list. Two entities (Goal, Task) satisfy "goal to plan decomposition" without an unjustified extra table (Sustainable Complexity, Principle 8).

**Decision (closed-loop auto-rollup, not a manual field):** `TasksService` calls `GoalsService.recalculateProgress(goalId)` after every mutation that can change task counts (create, status update, archive); a goal's `status`/`progress` are never something a client sets directly to reflect task completion.
**Alternatives considered:** Let clients PATCH a goal's `status` manually to `COMPLETED`; compute progress on read only, with no stored status transition.
**Reason:** The exit criteria explicitly asked for the "execution loop closed" — task execution state must propagate to the goal without a manual step, or the loop isn't actually closed. Archived goals are excluded from auto-rollup (a manual terminal state the rollup never overrides).

**Decision (reuse `ProjectsService.getOne`, don't widen `ProjectsService`'s internals):** Goal creation verifies project ownership via the already-public `ProjectsService.getOne(ownerId, projectId)`, imported through `ProjectsModule`. `ProjectsService.findOwnedOrThrow` stays private and untouched.
**Alternatives considered:** Make `findOwnedOrThrow` public, or add a new `assertOwned` method to `ProjectsService`.
**Reason:** Reuse-before-Extend — the already-exported method does exactly what's needed (ownership check + 404), so no change to tested Phase 2 code was justified. Also respects the modular-monolith rule that a module's data access is only reached through its own public service API, never a raw Prisma reach-through.

**Decision (ownerId denormalized on Goal and Task, not just reachable via join):** Both entities carry their own `ownerId`, checked directly rather than derived by joining up to `Project`.
**Reason:** Matches `Project`'s existing pattern; keeps every ownership check an O(1) `findUnique`, and each entity's authorization doesn't depend on its parent's row still existing in a particular shape.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md). **Phase:** 3.

## 2026-07-18 — Phase 4 implementation-level decisions

**Decision (event-driven decoupling via `@nestjs/event-emitter`, not deeper reuse-chaining):** `@pee/planning`'s `TasksService`/`GoalsService` `emit()` plain fact events (`task.status_changed`, `goal.status_changed`); `@pee/execution` subscribes via `@OnEvent` and separately depends on `PlanningModule` one-directionally for its own start/complete logic.
**Alternatives considered:** Have `@pee/execution` call into planning only, with no logging guarantee for the pre-existing generic `PATCH` routes; or make `@pee/planning` depend on `@pee/execution` directly to log inline.
**Reason:** The logging hook has to live inside `TasksService`/`GoalsService` to see every status-changing code path (not just the new dedicated endpoints), but `@pee/execution` also needs to call *into* `@pee/planning` — a direct two-way module dependency would be circular. `@nestjs/event-emitter` lets planning emit with zero knowledge of who's listening, avoiding the cycle while still guaranteeing unconditional observability.

**Decision (`ExecutionEvent` is append-only, no `updatedAt`/`version`):** deviates from the blanket per-table convention (`adr/0003`) that every syncable table gets those two columns.
**Reason:** The convention exists to support a future sync-merge protocol on *mutable* rows; a log entry is never mutated after insert, so those columns would carry no meaning. `TaskExecutionSession` keeps them since a session row is genuinely mutated once (on complete).

**Decision (read-path carve-out: `listActiveSessions` uses a Prisma `include`, not per-row service round-trips):** display-only `Task.title`/`Goal.title` are read via Prisma's relational `include` rather than calling `TasksService.getOne`/`GoalsService.getOne` once per open session.
**Alternatives considered:** Loop over sessions and call the owning service's `getOne` for each, to stay strictly within the "cross-module reads go through the public service API" rule established in Phase 3.
**Reason:** That rule exists to protect *ownership/authorization decisions* from being bypassed via raw Prisma access. Here, the row is already scoped to the caller via `TaskExecutionSession.ownerId` before the join runs — no authorization decision is made from the joined `Task`/`Goal` fields, only display text. Treating every read join as a rule violation would make simple aggregation views (a real product need) disproportionately expensive.

**Decision (time-tracking sessions are opt-in; event logging is not):** a `TaskExecutionSession` is only created via the dedicated `/tasks/:taskId/execution/start` endpoint; marking a task done via the pre-existing generic `PATCH /tasks/:id` still produces an `ExecutionEvent` (via the emitted event) but no session/duration data.
**Reason:** Forcing every task completion through a timer would change existing Phase 3 UI behavior (the plain "mark done" checkbox) for a feature (time tracking) the exit criteria didn't ask for. Observability (the event trail) is what the exit criteria required unconditionally; time-tracking is an added capability that's reasonable to make opt-in.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md). **Phase:** 4.

## 2026-07-18 — Phase 5 implementation-level decisions

**Decision (reusable reference SQLite client, not a browser retrofit):** Prove the sync protocol with a new, standalone `packages/local-client` (Prisma against a SQLite datasource) rather than adding client-side storage to `apps/web`.
**Alternatives considered:** Add WASM SQLite (sql.js/wa-sqlite) + IndexedDB persistence directly into the Next.js app, converting some pages/actions to client components with local-first read/write.
**Reason:** Exploration confirmed `apps/web` is 100% server-rendered (Server Components + Server Actions, BFF token custody, zero client-side fetch/storage today). Retrofitting real in-browser offline support now would be a large, risky rewrite of tested Phase 1-4 UI, and duplicates work Phase 8 (Desktop) will do properly with a native SQLite binding. **User confirmed this approach directly** when presented with the fork via `AskUserQuestion`. `packages/local-client` becomes the artifact Phase 8/9 build on rather than re-invent, instead of throwaway proof code.

**Decision (last-write-wins by wall-clock timestamp, guarded by an atomic version check — not CRDTs/vector clocks):** Conflict resolution compares `clientUpdatedAt` against the server row's `updatedAt`; `version` is only the fast-path optimistic-lock guard (`updateMany({ where: { id, ownerId, version: expectedVersion }, ... })`), not the source of truth for which edit survives.
**Alternatives considered:** A CRDT-based or vector-clock merge strategy for stronger multi-writer guarantees.
**Reason:** Every table here is single-owner (`ownerId`); genuine multi-device conflicts are rare, not the common case. CRDTs are disproportionate complexity for this data shape (Sustainable Complexity, Principle 8) — `adr/0003` itself named this exact trade-off when it rejected a CRDT-first design during Phase 0.5. Revisit only if real multi-device conflict frequency (not hypothetical) demands it — tracked in [27-backlog.md](27-backlog.md).

**Decision (`version` finally wired up as a live guard, on every write, not just sync-originated ones):** `ProjectsService`/`GoalsService`/`TasksService`'s `update()`/`archive()` (and `GoalsService.recalculateProgress`) now do `version: { increment: 1 }` unconditionally.
**Reason:** `adr/0003` declared this column on every syncable table from Phase 1 onward specifically for this moment, but no service had ever incremented it — discovered via a targeted grep before designing the conflict-resolution mechanics, since the whole optimistic-lock design depends on it actually changing. Incrementing on every write (not just sync pushes) keeps `version` meaningful regardless of which code path made the change.

**Decision (`id`/`updatedAt` overrides via an internal `options` parameter, not new DTO fields):** `ProjectsService.create(ownerId, dto, options?: { id, updatedAt })` etc., rather than adding `id?`/`updatedAt?` fields to the public `Create*Dto`/`Update*Dto` classes the HTTP controllers bind to.
**Alternatives considered:** Add the fields directly to the existing DTOs (the plan's original sketch).
**Reason:** A DTO field is potentially attacker-reachable through the public REST endpoint even with `whitelist`/`forbidNonWhitelisted` correctly configured elsewhere — a config mistake on this one route would let any authenticated caller spoof another row's timestamp or choose an arbitrary id. A separate function parameter can only ever be set by code that imports the service directly (i.e. `SyncPushService`), which is a strictly stronger guarantee for the same functionality. Chosen unilaterally during implementation as a security-hardening refinement of the approved plan, not a scope change.

**Decision (sync push reuses domain services for writes; the atomic version-guard touch is the one exception that goes straight to Prisma):** `SyncPushService` calls `ProjectsService.create`/`update` etc. for the actual persisted write, but does its own `prisma.<model>.updateMany(...)` for the race-free optimistic-lock check beforehand.
**Reason:** Reusing domain services keeps the Phase 3 rollup and Phase 4 `ExecutionEvent` emission firing for synced changes exactly as they do for any other write path — sync must never be a silent bypass of those guarantees. But no domain service supports a DB-level "only update if version still matches" atomic guard, and adding one would touch tested Phase 1-4 code more invasively than justified. Accepted trade-off: a successful sync-applied write bumps `version` by 2 (once for the guard touch, once inside the domain service's own `update()`), not 1 — harmless, since `version` is only ever a race guard, and `updatedAt` (passed through explicitly) remains the correct source of truth for LWW ordering.

**Decision (`ExecutionEvent` stays out of the sync registry):** Only `Project`/`Goal`/`Task` are syncable in Phase 5; `ExecutionEvent` (pull-only by nature, already append-only) and `TaskExecutionSession` (server-driven, unclear cross-device semantics) are explicitly excluded.
**Reason:** The sync registry's `SyncEntityDefinition` interface is shaped around bidirectional entities (`applyCreate`/`applyUpdate` are required); forcing a 4th, pull-only entry into it would mean awkward no-op methods or a second registry shape for one entity. `ExecutionEvent` is already served online via `GET /goals/:goalId/activity`, and no offline UI exists yet to need it cached locally. Tracked in [27-backlog.md](27-backlog.md), not silently dropped.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md). **Phase:** 5.

## 2026-07-18 — Phase 6 implementation-level decisions

**Decision (`AIProvider` exposes only `complete()`, not `stream`/`embed`):** the interface adr/0006 anticipated ("methods like `complete`, `stream`, `embed`") is built minimally — just what the one shipped feature needs.
**Alternatives considered:** Build all three methods up front, since adr/0006 named them.
**Reason:** adr/0006's wording was illustrative, not a mandate; no feature needs streaming output or embeddings yet, and building unused interface surface is speculative (Sustainable Complexity, Principle 8). Added the moment a real feature needs them — tracked in [27-backlog.md](27-backlog.md), not silently dropped.

**Decision (single active provider, selected by config — no automatic multi-provider failover):** `AI_PROVIDER` env var picks which vendor's implementation the DI factory constructs; only that vendor's API key is required at boot.
**Alternatives considered:** Try Claude first, automatically fall back to OpenAI on error.
**Reason:** Automatic failover doubles cost on every degraded call and makes "which model produced this recommendation" non-deterministic, undermining §100's explainability requirement (the response must state *which* model reasoned about it). No demonstrated reliability need justifies the added complexity yet. Revisit only if real failure-rate data demands it.

**Decision (explainability enforced at the recommendation boundary, not the raw-completion boundary):** `AIRecommendationResponse`/`AITaskSuggestion` (in `packages/types`) structurally require `reason`/`confidence`/`alternatives`/`context`; `AIProvider.complete()` itself carries no such requirement.
**Reason:** `complete()` is a generic LLM port — reason/confidence/alternatives don't universally apply to every possible completion (e.g. a future embedding call). Putting the guarantee on the recommendation type, with `AIRecommendationsService` as the one enforcement point every current/future recommendation feature flows through, achieves adr/0006's "enforced at the interface, not left to each caller" goal without conflating two different abstraction layers.

**Decision (AI suggestions never auto-create a `Task` — human approval is a structural data-flow gate):** `generateTaskSuggestions` only ever persists an `AIRecommendation`; only `accept(ownerId, id, { acceptedIndices })` writes to `Task`, via `TasksService.create` (not raw Prisma), for exactly the suggestions selected.
**Alternatives considered:** Auto-create all suggested tasks and let the user delete unwanted ones.
**Reason:** Principle 4 (Human Control) and the quality bar's "Reversible"/"Human control preserved" criteria are enforced by the data flow itself, not a UI convention that a future change could accidentally bypass. Reusing `TasksService.create` (rather than a bespoke insert) keeps accepted suggestions indistinguishable from manually-created tasks for every downstream concern (Phase 3 rollup, ownership).

**Decision (a provider failure or malformed structured output is persisted as `FAILED`, never silently dropped or fabricated):** `generateTaskSuggestions` catches both cases, writes an `AIRecommendation` row with `status: FAILED`, and returns a generic `ServiceUnavailableException` — never a partial or invented suggestion.
**Reason:** The quality bar's "Fails gracefully" criterion ("a bad/uncertain AI output degrades to a safe default, never a silent wrong action") requires this explicitly. Persisting the failed attempt (rather than just throwing) keeps the failure traceable — the same "never leave a known risk undocumented" discipline applied to runtime failures, not just design decisions.

**Decision (bounded prompt input — at most 50 existing task titles):** `buildTaskBreakdownContext` caps how many existing tasks are included in the prompt, regardless of how large a goal's task list grows.
**Reason:** Directly serves the "production-level stable system" requirement — an unbounded prompt would mean unbounded token cost/latency as a goal accumulates tasks over time. 50 is a generous-but-bounded ceiling; revisit only if a real goal needs more context than that to get useful suggestions.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [09-ai-architecture.md](09-ai-architecture.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md). **Phase:** 6.

## 2026-07-18 — Phase 7 implementation-level decisions

**Decision (Phase 7's scope was self-defined, not inherited):** Unlike every prior phase, `16-roadmap.md` had no PRD entry, ADR, or exit-criteria text for "Analytics" beyond the bare phase name. The scope chosen — read-only aggregate views over Phases 2-6's existing data (status breakdowns, completion velocity, time tracking) — was derived from what data the product already has plus the user's literal exit criterion ("metrics live in `dashboard/METRICS.md`").
**Alternatives considered:** A broader analytics platform (custom report builder, exportable data, charting library); deferring scope entirely and asking the user to specify features.
**Reason:** Sustainable Complexity (Principle 8) — one well-built read layer over existing data, proportional to every prior phase's single-domain-slice pattern, not a speculative platform build. The literal exit criterion gave an unambiguous, checkable definition of "done" without needing further scoping input.

**Decision (live query aggregation, not a materialized summary table or scheduled job):** `SummaryService`/`VelocityService`/`TimeTrackingService` all compute their results at request time via Prisma `groupBy`/`aggregate`/bounded `findMany`, never a precomputed rollup.
**Alternatives considered:** A nightly job populating a denormalized `analytics_summary` table; an incremental counter updated on every write.
**Reason:** Per-user data volumes are small; a summary table or job would be speculative infrastructure for a load that doesn't exist yet (Sustainable Complexity, Principle 8), and would introduce a staleness/consistency concern (when was it last computed?) that live queries don't have. Revisit only if real usage data shows query cost becoming a problem — tracked in [27-backlog.md](27-backlog.md).

**Decision (analytics queries Prisma directly, bypassing `@pee/planning`/`@pee/execution`/`@pee/ai`):** `@pee/analytics` depends only on `@pee/database`/`@pee/auth`/`@pee/types`, not on any other domain module.
**Alternatives considered:** Route every read through the owning module's public service (e.g. call `GoalsService`/`TasksService` per row) to strictly follow the "cross-module reads go through the public service API" rule from Phase 3.
**Reason:** That rule protects *authorization decisions* from being bypassed via raw Prisma access. Every analytics query is already scoped by `ownerId` from the JWT before any join runs, and no authorization decision is made from the joined data — exactly the documented carve-out Phase 4's `listActiveSessions` established. Routing an aggregate query through N per-row service calls would also be a real performance regression for no safety benefit.

**Decision (bounded date-range window on every query, no unbounded full-history scan):** `VelocityQueryDto.days` is capped 1-90 (default 30); `TimeTrackingQueryDto.sinceDays` is capped 1-365 (default 90).
**Reason:** Directly serves the "production-level stable system" requirement — without a cap, a long-lived account's query cost would grow unbounded with account age. Mirrors Phase 6's bounded-prompt precedent (cap input size at the point it's read, not just at display time).

**Decision (one supporting index, no new Prisma model):** Added `@@index([ownerId, createdAt])` to `ExecutionEvent`; no new table was introduced this phase.
**Reason:** Analytics is a read layer over data Phases 2-6 already model — inventing a new domain entity to represent "a metric" would be modeling a view as if it were data. The one schema change reflects the velocity endpoint's actual query shape (scan by owner, filter by date range), which the existing single-column `[ownerId]` index doesn't serve as well at scale.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [16-roadmap.md](16-roadmap.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md). **Phase:** 7.

## 2026-07-18 — Phase 8 implementation-level decisions

**Decision (Electron over Tauri, so `@pee/local-client` runs unmodified):** `apps/desktop`'s main process is Node.js (Electron), directly importing `LocalStore`/`SyncClient` with zero adaptation.
**Alternatives considered:** Tauri (Rust backend + webview), per-platform native wrappers embedding a webview around `apps/web`.
**Reason:** Tauri's Rust backend cannot run a TypeScript/Prisma library without reimplementing it — exactly the rewrite the exit criteria forbid. Native wrappers around `apps/web` offer no offline capability and no path to consuming `@pee/local-client` at all. Full rationale: [adr/0007](../adr/0007-desktop-shell-electron.md).

**Decision ("no rewrite" is satisfied at the API/library level, not the presentation layer):** The renderer (`apps/desktop/src`) is a new React+Vite app, not a literal reuse of `apps/web`'s Server Components.
**Alternatives considered:** Load `apps/web`'s pages inside a `BrowserWindow` pointed at a running Next.js server.
**Reason:** Next.js Server Components/Server Actions are architecturally incompatible with an offline-first client that needs synchronous local IPC reads — there is no meaningful way to "reuse" server-rendered pages for a client that must work without a server connection. The exit criteria's literal targets — the backend API contract and `@pee/local-client` — are reused unmodified; the renderer reuses `apps/web`'s Tailwind conventions instead of its rendering architecture, since no shared design-system package exists to reuse in either case.

**Decision (desktop's offline scope matches `@pee/local-client`'s existing sync registry exactly — Project/Goal/Task — not widened):** Execution sessions, AI suggestions, and analytics are online-only IPC passthroughs to the same REST endpoints `apps/web` calls, not synced locally.
**Alternatives considered:** Extend `@pee/local-client`'s sync registry to cover `TaskExecutionSession`/`AIRecommendation`/analytics so the desktop app has a fuller offline story.
**Reason:** Phase 5 deliberately scoped the sync registry to three bidirectional entities; widening it now, mid-Phase-8, would itself be a form of rewriting `@pee/local-client` rather than reusing it. Tracked as a genuine desktop UX limitation in [27-backlog.md](27-backlog.md), not silently accepted as sufficient forever.

**Decision (Electron main process is the new token-custody location, same BFF discipline as `apps/web`):** `AuthSession` holds the access token in memory and the refresh token encrypted via `safeStorage`; the renderer only ever receives a `UserProfile`.
**Reason:** Mirrors the existing "server holds the token" pattern exactly — the desktop app's main process is architecturally the same trust boundary as `apps/web`'s Next.js server, just relocated to the user's own machine instead of a remote server.

**Decision (first-run local SQLite bootstrap reuses `@pee/local-client`'s own test-fixture pattern — `prisma db push` via `execFileSync`, not a bundled pre-migrated template file):** `local-store-factory.ts` mirrors `packages/local-client/test/test-db.ts` exactly.
**Alternatives considered:** Ship a pre-built, pre-migrated SQLite file as a packaged app resource and copy it into place on first launch.
**Reason:** Reuses an already-proven pattern rather than building new packaging machinery; genuinely verified end-to-end in this session (real SQLite file, all 6 tables, in the authoring sandbox — no Docker needed). The template-file approach is a legitimate production-packaging improvement, deferred to backlog rather than built speculatively before any packaging/distribution work exists.

**Decision (packaging/signing/auto-update explicitly out of scope this phase):** `electron-builder.yml` targets an unsigned local build only; no CI packaging step, no signing certs, no auto-update.
**Reason:** Distribution infrastructure (code signing, update servers, a cross-platform CI matrix) is a separate concern from "does the app work, and does it satisfy the reuse constraints" — attempting it without real signing credentials would produce untested, unusable packaging config. Tracked in [27-backlog.md](27-backlog.md).

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [12-security.md](12-security.md), [16-roadmap.md](16-roadmap.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md), [adr/0007](../adr/0007-desktop-shell-electron.md). **Phase:** 8.

## 2026-07-18 — Phase 9 implementation-level decisions

**Decision (Expo/React Native, with a ported storage engine instead of Prisma-in-RN):** `apps/mobile` is Expo-managed React Native; its local storage is a new `MobileStore` (expo-sqlite) with the exact method surface of `LocalStore`, and a `MobileSyncClient` that is a line-for-line port of `SyncClient`'s algorithm.
**Alternatives considered:** `nodejs-mobile-react-native` (embed a real Node runtime so `@pee/local-client` could theoretically run); Capacitor (webview wrapper around `apps/web` + a community SQLite plugin).
**Reason:** Confirmed by reading the code that Prisma's query engine has no published Android/iOS binary target — even a real embedded Node runtime doesn't solve that, since the missing piece is the *engine binary*, not the JS runtime. `nodejs-mobile-react-native` would trade one rewrite for a more fragile, exotic one. Capacitor has the same "wrapping server-rendered pages has no path to local synchronous reads" problem `adr/0007` already rejected for Desktop, plus a less mature SQLite story. Full rationale: [adr/0008](../adr/0008-mobile-local-storage.md).

**Decision ("no rewrite" satisfied at the protocol/type level, not the storage-engine level):** `@pee/types`'s sync DTOs and the `services/sync` REST contract are imported/called completely unmodified; only the storage engine (Prisma → expo-sqlite) and the algorithm's *host* (a port, not an import) differ from `apps/desktop`.
**Alternatives considered:** Treat "or an equivalent" as license to design a materially different sync approach for mobile (e.g. a simpler last-pull-wins model without the outbox pattern).
**Reason:** The exit criteria's actual constraint is behavioral fidelity to the proven protocol, not a specific import statement — porting the exact algorithm (cursor bookkeeping, outbox collapsing, conflict resolution) preserves everything that makes the protocol correct, while only substituting the one piece that is fundamentally platform-bound.

**Decision (mobile's offline scope matches Desktop's exactly — Project/Goal/Task — not widened):** Execution sessions, AI suggestions, and analytics are online-only passthroughs (`api/remote-client.ts`), identical scope boundary to `apps/desktop`.
**Reason:** Same reasoning as Phase 8's equivalent decision — widening the sync scope mid-phase would itself be a form of scope creep beyond "reuse the protocol," not a reuse of it. Tracked in [27-backlog.md](27-backlog.md).

**Decision (`MobileStore`'s repos expose explicit `getById`/`listByX` methods, fixing a coupling wart rather than reproducing it):** `MobileSyncClient.buildPushChange` calls `store.projects.getById(...)` etc., rather than reaching into a Prisma-shaped internal the way `@pee/local-client`'s own `SyncClient.buildPushChange` reaches into `store.db.localProject.findUnique(...)`.
**Reason:** Since the storage engine had to be rewritten anyway, this was a zero-cost opportunity to give the port a cleaner interface boundary than the original — the algorithm's *behavior* is unchanged, only how it reads data internally.

**Decision (no main/renderer split, so custody moves to React Context, not an IPC bridge):** `MobileAuthSession`/`MobileStore`/`BackgroundSyncRunner` are each constructed once and exposed via React Context providers (`auth-context.tsx`, `store-context.tsx`, `sync-context.tsx`), consumed directly by screens.
**Alternatives considered:** Simulate an IPC-like boundary for consistency with Desktop's architecture.
**Reason:** React Native is a single JS process — there is no separate main process to protect a renderer from, so an IPC-style abstraction would be complexity with no corresponding security or architectural benefit (Sustainable Complexity, Principle 8). Context providers are the idiomatic React pattern for "one shared instance, many consumers."

**Decision (Detox e2e written and CI-wired, but not run, and not force-run via a workaround):** Unlike Phase 8's Electron e2e (which found a real headless-launch path in this sandbox), Detox genuinely requires an Android emulator or iOS Simulator with no headless equivalent.
**Alternatives considered:** Skip writing the e2e spec entirely, since it can't be verified here; or claim it as "verified" based on unit-test coverage alone.
**Reason:** Writing the spec now means it's ready the moment a real device/CI runner is available, consistent with every prior phase's Docker-dependent e2e specs. Honestly documenting it as unrun (in `18-current-state.md`, `20-known-issues.md`, `02-prd.md`'s acceptance criteria) rather than glossing over the gap or claiming false verification.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [12-security.md](12-security.md), [16-roadmap.md](16-roadmap.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md), [adr/0008](../adr/0008-mobile-local-storage.md). **Phase:** 9.

## 2026-07-18 — Phase 10 implementation-level decisions

**Decision (multi-tenancy is additive `Organization`/`Membership` alongside `ownerId`, resolved per-request, not a stateful session concept):** `Project`/`Goal`/`Task` keep `ownerId` (creator, used for destructive-permission checks) and gain `organizationId`; there is no "active organization" stored anywhere server-side — `CreateProjectDto.organizationId` and `?organizationId=` query params are the only places it appears, both optional (defaulting to the caller's personal org).
**Alternatives considered:** A full remodel dropping `ownerId` entirely; a stateful "active org" concept in the JWT/session.
**Reason:** A full remodel would be a genuine rewrite of destructive-permission and sync-conflict semantics that already depend on `ownerId`, not an additive retrofit. A stateful session concept would be the first stateful piece in an otherwise fully stateless JWT model, for no capability a request parameter doesn't already provide. See `adr/0009`.

**Decision (RBAC retrofit touches exactly `ProjectsService`/`GoalsService`/`TasksService`, and no other module):** `findOwnedOrThrow` → `findAccessibleOrThrow` (membership-based) plus `assertDestructivePermission` (creator-or-admin) in those three services only.
**Reason:** Confirmed by reading the code, not assumed, that `services/execution`/`services/ai`/`services/sync` all delegate writes through these same three services — so the retrofit propagates automatically. `services/analytics` bypasses domain services by design (Phase 4/7's documented read-only-direct-Prisma carve-out) and was deliberately left owner-scoped rather than widened, since that would be new work, not a retrofit.

**Decision (a circular package dependency was found — a real bug, not a style nitpick — and fixed by moving org/membership reads into `@pee/auth` via raw Prisma):** `AuthService.toProfile()`/`createUserWithPersonalOrganization()` read `Membership`/`Organization` directly instead of calling `OrganizationsService`.
**Alternatives considered:** `forwardRef()` on both module imports; an event-driven `user.registered` listener in `@pee/organizations`.
**Reason:** The cycle is a genuine Node.js CommonJS `require()` cycle (confirmed by a runtime `TypeError: (0, auth_1.CurrentUser) is not a function`), not a Nest DI-graph cycle — `forwardRef` only fixes the latter. An event-driven listener was rejected because registration should fully succeed or fully fail before returning to the caller; the small (~3-line) raw-Prisma duplication was judged a better trade than eventual consistency for this specific step, consistent with the project's existing precedent of small bounded raw-Prisma exceptions (`services/sync`'s atomic version-guard).

**Decision (OIDC uses Auth.js's native provider; SAML gets a self-built SP behind an OAuth2 façade, not a third-party bridge service):** `apps/web/auth.ts` registers `{ type: 'oidc' }` for OIDC (Auth.js runs the whole exchange) and a generic `{ type: 'oauth' }` provider for SAML, pointed at `services/auth/src/sso/saml/`'s own `authorize`/`token`/`userinfo` endpoints (backed by `@node-saml/node-saml`).
**Alternatives considered:** Skip SAML entirely; adopt a third-party SAML-to-OIDC bridge (e.g. BoxyHQ Jackson) instead of building one in-house.
**Reason:** The exit criteria names SAML explicitly, so skipping it wasn't an option. A third-party bridge would introduce a new external dependency/account for a capability buildable in-house at a bounded, explicitly-scoped-down cost (SP-initiated only, single IdP, no SLO, no encrypted assertions).

**Decision (two real security issues, found during this phase's own review pass, fixed before considering the phase done):** `SsoProvisionGuard`'s secret comparison switched from `!==` to `crypto.timingSafeEqual`; the SAML bridge's redirect-allowlist check switched from `redirectUri.startsWith(allowedOrigin)` (a classic open-redirect bypass) to comparing parsed `URL.origin` values, extracted into its own testable file (`saml/redirect-allowlist.ts`) with a dedicated regression test asserting the exact bypass string is rejected.
**Reason:** A security review pass that finds nothing is a red flag, not a clean bill of health, for code this new — both issues were genuinely present in the first-written version, not contrived for the log entry.

**Impact:** [08-backend-guidelines.md](08-backend-guidelines.md), [10-database-design.md](10-database-design.md), [11-api-contract.md](11-api-contract.md), [12-security.md](12-security.md), [16-roadmap.md](16-roadmap.md), [20-known-issues.md](20-known-issues.md), [27-backlog.md](27-backlog.md), [adr/0009](../adr/0009-multi-tenancy-rbac-sso.md). **Phase:** 10.

## 2026-07-19 — Run a full production-hardening audit, then fix every P0 finding before scoping any new feature

**Decision:** Ran the "Production Hardening" role from `System_Prompt/Part1.md` as four independent verification passes across the whole repo (architecture/code-quality, security/reliability, performance/observability/testing, CI-CD/ops/API/config/DX), each grounded in direct file reads rather than trusting prior memory-bank claims. The audit scored overall production readiness **4/10 — not approved for production release** — on two Critical findings (CI's `prisma migrate deploy` step had nothing to apply, since no migration had ever been generated, so no e2e result was verifiable; there was no deployment target of any kind) plus 8 more High findings. Rather than only report the findings, fixed all 7 P0 roadmap items in the same session: the migration, both Dockerfiles + a deploy runbook, a new `@pee/logging` package (structured JSON logs + request correlation), `AbortController` timeouts on every client→API call across `apps/web`/`apps/desktop`/`apps/mobile`, a real Prisma-backed `/health` + graceful shutdown, a Joi env-validation schema at boot, and closing the SSO `.env.example`/secret-fallback gaps (including a genuine secret-reuse-across-trust-domains bug in `SamlBridgeService`).
**Alternatives considered:** Report the audit findings only and wait for separate explicit authorization per item (this project's "Mandatory Stop Rule" and "Decision Escalation Rules" would normally argue for this); fix only the two Critical items and leave the rest for a later session.
**Reason:** The user's explicit instruction after seeing the audit was "continue with P0, implementation," naming P0 specifically (not P1-P3) and asking for a "scalable and production level stable system" — a single, bounded, already-fully-specified list (the audit's own roadmap section, with concrete "done when" criteria per item) rather than an open-ended new feature, so implementing it directly (rather than re-pausing to ask permission item-by-item) matched the instruction's scope.
**Impact:** [17-phase-status.md](17-phase-status.md) (new "Post-Phase-10 — Production Hardening (P0)" section), [18-current-state.md](18-current-state.md), [19-active-work.md](19-active-work.md), [20-known-issues.md](20-known-issues.md) (migration and SAML-fallback rows resolved), [12-security.md](12-security.md), [15-deployment.md](15-deployment.md) (rewritten from "TBD"), [27-backlog.md](27-backlog.md) (audit's P1 list added, not yet actioned). **Phase:** Post-10 (hardening, not a numbered product phase).

**Decision (generate the initial Prisma migration via `prisma migrate diff --from-empty`, not `prisma migrate dev`):** Used `prisma migrate diff --from-empty --to-schema-datamodel packages/database/prisma/schema.prisma --script` to produce `packages/database/prisma/migrations/20260719000000_init/migration.sql`, rather than `prisma migrate dev`.
**Alternatives considered:** `prisma migrate dev --name init` (the normal, recommended path); leaving the migration ungenerated until Docker/Postgres is available.
**Reason:** `migrate dev` requires a live database connection to diff against, and this sandbox has none (confirmed: no `docker`, no `psql`, no `pg_isready` on `PATH`). `migrate diff --from-empty` needs no live connection — it diffs the schema file against an empty baseline — and produces the exact same SQL a from-empty `migrate dev` would, satisfying CI's `migrate deploy` step immediately rather than leaving the Critical finding open pending an environment change.
**Impact:** [20-known-issues.md](20-known-issues.md) (with an honest caveat: not yet applied against a live Postgres in this sandbox — re-verify the first time one is available).

**Decision (apps/web's Docker image needs no monorepo-aware build, only services/api's does):** `apps/web/next.config.js` gained `output: 'standalone'`; `infrastructure/docker/web.Dockerfile` is a plain single-app multi-stage build with no `@pee/*` workspace copying, while `infrastructure/docker/api.Dockerfile` keeps the full npm-workspaces `node_modules` layout intact in its runtime stage.
**Reason:** Ran a real `next build` with `output: 'standalone'` and inspected the result — every `@pee/types` import across `apps/web/lib/*-api-client.ts` is `import type`, which erases completely at compile time, so the standalone bundle's traced `node_modules` contains zero `@pee/*` packages, confirmed by inspection rather than assumed. `services/api` genuinely needs the real `@pee/*` classes at runtime (NestJS DI), so its Dockerfile can't take the same shortcut.
**Impact:** [15-deployment.md](15-deployment.md), [18-current-state.md](18-current-state.md).
