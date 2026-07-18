# 02 — Product Requirements Document

**Status: Phase 9 (Mobile) written and implemented, 2026-07-18.**

## Phase 1 — Authentication

- **Objective:** Let a person register, sign in, stay signed in via short-lived access tokens with rotating refresh tokens, and sign out — as the system-of-record foundation every later phase's authorization depends on.
- **Current state:** No product code existed; architecture was resolved via `adr/0002`, `adr/0003`, `adr/0005`.
- **Desired state:** A NestJS `auth` module (system of record for users/credentials) and a Next.js/Auth.js frontend, both against the resolved stack.
- **Required APIs:** `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** New `User`, `RefreshToken`, `AuthAuditLog` tables — see [10-database-design.md](10-database-design.md).
- **UI impact:** `/login`, `/register`, `/dashboard` pages; middleware-protected dashboard route.
- **AI impact:** None.
- **Testing strategy:** Unit (password/token/service logic, DTO validation), integration + e2e (Supertest against a real Postgres), frontend unit (Vitest+RTL) and one Playwright e2e for the full register→login→dashboard→logout flow. See [13-testing-strategy.md](13-testing-strategy.md).
- **Migration requirements:** First Prisma migration (`packages/database/prisma`); no prior data to migrate.
- **Observability impact:** `AuthAuditLog` records LOGIN_SUCCESS/LOGIN_FAILURE/LOGOUT/TOKEN_REFRESH/TOKEN_REUSE_DETECTED.
- **Security considerations:** argon2 password hashing, opaque hashed refresh tokens with rotation + reuse detection, rate limiting on register/login, browser never holds a raw JWT (BFF pattern via Auth.js server-side session) — see [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `21-decision-log.md`, `27-backlog.md`.
- **Acceptance criteria:**
  - [x] Register/login/refresh/logout/me endpoints implemented and validated server-side
  - [x] Refresh rotation with reuse detection implemented
  - [x] Rate limiting on register/login
  - [x] Audit logging of auth events
  - [x] Unit tests passing (26 across `@pee/auth`, `@pee/api`, `web`)
  - [x] Integration/e2e tests written (require Docker Postgres — not run in the authoring sandbox, wired into CI)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [ ] OAuth social login, email verification, password reset — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 2 — Projects

- **Objective:** Let an authenticated user create, organize, and archive their own projects — the first real domain entity in the product, built directly on the Phase 1 auth foundation.
- **Current state:** Only `User`/`RefreshToken`/`AuthAuditLog` existed; no project/domain data model.
- **Desired state:** A `Project` entity owned by exactly one `User`, exposed via a NestJS `projects` module, with a Next.js UI to list/create/edit/archive.
- **Required APIs:** `POST /projects`, `GET /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id` (soft-delete/archive) — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** New `Project` table (`ProjectStatus` enum `ACTIVE`/`ARCHIVED`) — see [10-database-design.md](10-database-design.md).
- **UI impact:** `/dashboard/projects` (list), `/dashboard/projects/new` (create), `/dashboard/projects/[id]` (edit), linked from `/dashboard`.
- **AI impact:** None.
- **Testing strategy:** Unit (`ProjectsService`, mocked Prisma) + DTO validation, integration/e2e (Supertest against a real Postgres), frontend unit (Vitest+RTL for `ProjectForm`) and Playwright e2e for the full create→list→edit→archive flow.
- **Migration requirements:** Adds `Project` to the existing Prisma schema; no migration file has been generated yet (requires a live Postgres via Docker, unavailable in the authoring sandbox — same constraint as Phase 1). Must run `npx prisma migrate dev --name add_projects --schema packages/database/prisma/schema.prisma` once Docker is available, before this can be deployed anywhere.
- **Observability impact:** None new — project CRUD is not logged to `AuthAuditLog` (that table is auth-event-specific); no equivalent audit trail exists yet for project actions (see [20-known-issues.md](20-known-issues.md)).
- **Security considerations:** Every route requires a valid access JWT (`JwtAuthGuard`); ownership enforced in `ProjectsService` with cross-user access returning 404 (not 403) to avoid resource enumeration — see [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `21-decision-log.md`, `27-backlog.md`.
- **Acceptance criteria:**
  - [x] Create/list/get/update/archive endpoints implemented and validated server-side
  - [x] Ownership enforcement (404 on cross-user access) implemented
  - [x] Pagination, status filter, and search implemented on the list endpoint
  - [x] Unit + DTO tests passing (20 in `@pee/projects`, plus 5 frontend Vitest tests)
  - [x] Integration/e2e tests written (require Docker Postgres — not run in the authoring sandbox, wired into CI)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [ ] No initial Prisma migration generated yet — requires Docker (see Migration requirements above)
  - [ ] Multi-user project sharing, templates, tags — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 3 — Planning Engine

- **Objective:** Let a user decompose a project `Goal` into an ordered set of `Task`s (the plan) and have the goal's status/progress track task completion automatically — closing the loop from plan to execution outcome without a manual step.
- **Current state:** Only `Project` existed as a domain entity; no way to break work down into actionable steps or track completion.
- **Desired state:** `Goal` (nested under a `Project`) and `Task` (nested under a `Goal`) entities, both single-owner like `Project`; task status changes roll up into the parent goal's `status` and a computed `progress` automatically.
- **Required APIs:** `POST/GET /projects/:projectId/goals`, `GET/PATCH/DELETE /goals/:id`, `POST/GET /goals/:goalId/tasks`, `GET/PATCH/DELETE /tasks/:id` — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** New `Goal` and `Task` tables (`GoalStatus` enum `NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`/`ARCHIVED`; `TaskStatus` enum `TODO`/`IN_PROGRESS`/`DONE`/`ARCHIVED`) — see [10-database-design.md](10-database-design.md).
- **UI impact:** `/dashboard/projects/[id]/goals` (list), `/dashboard/projects/[id]/goals/new` (create), `/dashboard/goals/[id]` (detail — progress, task list, inline task creation, mark-done/archive), `/dashboard/goals/[id]/edit`.
- **AI impact:** None (AI-assisted plan generation is a Phase 6 concern, deferred to backlog).
- **Testing strategy:** Unit (`GoalsService`/`TasksService`, mocked Prisma + mocked collaborator service) + DTO validation, integration/e2e (Supertest against a real Postgres, asserting the rollup behavior end-to-end), frontend unit (Vitest+RTL for `GoalForm`/`TaskForm`) and Playwright e2e for the full goal/task/completion flow.
- **Migration requirements:** Adds `Goal`/`Task` to the existing Prisma schema; no migration file has been generated yet — same unresolved Docker-dependent gap carried forward from Phases 1-2 (see [20-known-issues.md](20-known-issues.md)).
- **Observability impact:** None new — goal/task actions are not audit-logged, same carried-forward gap as `Project`.
- **Security considerations:** Every route requires a valid access JWT (`JwtAuthGuard`); ownership enforced directly on `Goal`/`Task` (`ownerId`, 404-not-403); goal creation additionally re-verifies the parent project's ownership via the already-exported `ProjectsService.getOne` (no `ProjectsService` internals were changed) — see [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `21-decision-log.md`, `27-backlog.md`.
- **Acceptance criteria:**
  - [x] Create/list/get/update/archive endpoints implemented for both `Goal` and `Task`
  - [x] Ownership enforcement (404 on cross-user access) implemented on both entities
  - [x] Closed-loop progress rollup: task status changes automatically recalculate goal `status` and `progress`
  - [x] Unit + DTO tests passing (31 in `@pee/planning`, plus 2 new frontend Vitest specs)
  - [x] Integration/e2e tests written (require Docker Postgres — not run in the authoring sandbox, wired into CI)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new file stays under ~300 lines (largest is `goals.service.ts` at 151 lines)
  - [ ] No initial Prisma migration generated yet — requires Docker (carried forward from Phases 1-2)
  - [ ] Task dependencies/scheduling, AI-assisted plan generation, multi-user goal collaboration — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 4 — Execution Engine

- **Objective:** Make the goal→task execution loop observable end-to-end — not just closed at the data level (Phase 3), but genuinely *executed* (a real start/complete timer per task) and *visible* (an unconditional event trail plus a live "what's running right now" dashboard).
- **Current state:** Phase 3 closes the loop silently — task completion rolls up into goal progress, but there's no record of *when* work happened or *what* changed, and no way to see a task actually in progress versus just flagged.
- **Desired state:** A `TaskExecutionSession` (start/stop timer, one open session per task) and an append-only `ExecutionEvent` log capturing every task/goal status transition, regardless of entry point (dedicated start/complete endpoints or the existing generic `PATCH`).
- **Required APIs:** `POST /tasks/:taskId/execution/start`, `POST /tasks/:taskId/execution/complete`, `GET /goals/:goalId/activity`, `GET /execution/active` — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** New `TaskExecutionSession` and `ExecutionEvent` tables (`ExecutionEventType` enum) — see [10-database-design.md](10-database-design.md).
- **UI impact:** Start/Complete controls and an activity timeline on `/dashboard/goals/[id]`; new `/dashboard/execution` global "Active Work" dashboard, linked from `/dashboard`.
- **AI impact:** None.
- **Testing strategy:** Unit (`TaskSessionsService`/`ExecutionEventsService`, mocked Prisma + mocked `TasksService`), extended `@pee/planning` unit tests asserting `EventEmitter2.emit` calls, integration/e2e (Supertest against a real Postgres, asserting the full start→complete→activity→active-list flow), frontend Playwright e2e for the observable start/complete flow.
- **Migration requirements:** Adds `TaskExecutionSession`/`ExecutionEvent` to the existing Prisma schema; same unresolved Docker-dependent no-migration-ever-generated gap carried forward from Phases 1-3 (see [20-known-issues.md](20-known-issues.md)).
- **Observability impact:** This *is* the observability layer — `ExecutionEvent` is the audit trail for task/goal status transitions that Phases 2-3 didn't have. Fires unconditionally via `@nestjs/event-emitter`, decoupled from `@pee/planning` (no import added there), so no future status-changing code path can silently skip logging.
- **Security considerations:** No new authz model — `JwtAuthGuard` on every route; start/complete reuse `TasksService.getOne`/`update` (404-not-403 preserved); activity/active-session queries filter directly by `ownerId`. One documented carve-out: `listActiveSessions` reads `Task`/`Goal` title fields via Prisma `include` rather than round-tripping through their services, since the row is already owner-scoped and no authorization decision is made from the joined data — see [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `21-decision-log.md`, `27-backlog.md`.
- **Acceptance criteria:**
  - [x] Start/complete endpoints implemented, reusing `TasksService.update` (no duplicated status logic)
  - [x] `ExecutionEvent` fires unconditionally on every task/goal status change, regardless of entry point
  - [x] Per-goal activity timeline and global active-sessions dashboard implemented
  - [x] Unit tests passing (12 in `@pee/execution`, plus 3 new assertions added to existing `@pee/planning` specs — 101 total across the workspace)
  - [x] Integration/e2e tests written (require Docker Postgres — not run in the authoring sandbox, wired into CI)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new/edited file stays under ~300 lines (largest new file is `execution-events.service.ts` at 122 lines)
  - [ ] No initial Prisma migration generated yet — requires Docker (carried forward from Phases 1-3)
  - [ ] Multi-pause/resume sessions, cross-service distributed tracing — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 5 — Memory Engine

- **Objective:** Design and implement the first real local-first sync protocol — SQLite (local, per-device) ↔ PostgreSQL (server, source of truth) — that `adr/0003` fixed the storage pairing for but deliberately deferred the reconciliation mechanics of. This is the storage substrate later phases (offline UI, AI context) read from as the system's durable record of the user's work.
- **Current state:** Every table has had client-generated-UUID PKs and `updatedAt`/`version` columns since Phase 1 (per `adr/0003`), but no code ever used `version` for anything, and no sync endpoint existed. `apps/web` is 100% server-rendered with zero client-side storage.
- **Desired state:** A generic, registry-driven sync module (`services/sync`) supporting bidirectional reconciliation for `Project`/`Goal`/`Task`, using an atomic optimistic-lock version guard with a last-write-wins-by-timestamp fallback; a reusable reference SQLite client (`packages/local-client`) that proves the protocol end-to-end against a real embedded database.
- **Required APIs:** `POST /sync/pull`, `POST /sync/push` — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** Composite `[ownerId, updatedAt]` index added to `Project`/`Goal`/`Task`; `version` wired up as a live increment on every write. A wholly separate SQLite Prisma schema in `packages/local-client` (`LocalProject`/`LocalGoal`/`LocalTask`/`LocalExecutionEvent`/`SyncCursor`/`SyncOutboxEntry`) — see [10-database-design.md](10-database-design.md).
- **UI impact:** None — `apps/web` is deliberately untouched this phase (see Security considerations). `packages/local-client` has no UI; it's a library.
- **AI impact:** None directly, but this is the persistence substrate Phase 6+ AI features may eventually read from for "what has the user actually done" context.
- **Testing strategy:** Unit (`SyncPullService`/`SyncPushService`, mocked Prisma + mocked domain services; `LocalStore`/`SyncClient` against a real, ephemeral, temp-file SQLite database — no Docker needed for either), extended `@pee/projects`/`@pee/planning` specs (id/updatedAt passthrough, version-increment assertions), integration/e2e (`services/sync/test/sync.e2e-spec.ts` and `packages/local-client/test/sync-roundtrip.e2e-spec.ts`, both requiring Docker Postgres — the latter's SQLite half needs no infra at all).
- **Migration requirements:** Adds two indexes to the existing Postgres schema; same unresolved Docker-dependent no-migration-ever-generated gap carried forward from Phases 1-4. `packages/local-client`'s SQLite schema needs no migration history — each local file is provisioned fresh via `prisma db push`.
- **Observability impact:** None new server-side — sync push reuses the existing domain services for writes specifically so the Phase 3 rollup and Phase 4 `ExecutionEvent` log keep firing for synced changes; sync is not a separate, unaudited write path.
- **Security considerations:** No new authz model — `JwtAuthGuard` on every route; push always forces `ownerId` from the authenticated caller, never trusts it from the payload; a push targeting another owner's row is rejected the same 404-shaped way as every other cross-owner access. Per-entity payload validated twice (outer DTO shape, then a `whitelist`/`forbidNonWhitelisted` check against the specific entity's own fields) so a client can't smuggle an unexpected field through the generic `data` blob. `apps/web` was confirmed (via exploration) to be 100% server-rendered with zero client-side fetch/storage — retrofitting real browser offline support now would be a disproportionate rewrite of tested Phase 1-4 UI; the user confirmed building a reusable reference client instead, deferring the web retrofit to Phase 8/9 — see [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `21-decision-log.md`, `27-backlog.md`.
- **Acceptance criteria:**
  - [x] `POST /sync/pull`/`POST /sync/push` implemented, bidirectional for `Project`/`Goal`/`Task`
  - [x] Optimistic-lock version guard + last-write-wins-by-timestamp conflict resolution implemented and tested (both directions)
  - [x] Sync push reuses domain services for writes, so rollup/event side effects keep firing for synced changes
  - [x] `packages/local-client` reference SQLite client (`LocalStore` + `SyncClient`) implemented and proven against a real embedded database
  - [x] Unit tests passing (28 in `@pee/sync`, 13 in `@pee/local-client`, plus new assertions in `@pee/projects`/`@pee/planning` — 148 total across the workspace)
  - [x] Integration/e2e tests written (require Docker Postgres — not run in the authoring sandbox, wired into CI)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new/edited file stays under ~300 lines (largest new file is `local-store.ts` at 159 lines)
  - [ ] No initial Prisma migration generated yet — requires Docker (carried forward from Phases 1-4)
  - [ ] `apps/web` browser-side offline support, `ExecutionEvent`/`TaskExecutionSession` sync coverage, local-file-at-rest encryption, richer multi-device conflict resolution — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 6 — AI Integration

- **Objective:** Build the first-party `AIProvider` abstraction fixed by `adr/0006` and ship a real, end-to-end AI-native feature on top of it — not just the interface — passing `evaluation/ai-feature-quality-bar.md`.
- **Current state:** No AI code existed (`09-ai-architecture.md` status: "no AI subsystem implemented"); the provider-abstraction shape was decided in Phase 0.5 but never built.
- **Desired state:** A dedicated `ai` Nest module exposing `AIProvider.complete()` behind a config-selected factory (Anthropic Claude active by default, OpenAI as the second implementation proving the abstraction generalizes), consumed by one concrete feature: goal → task-breakdown suggestions, gated behind explicit human accept/dismiss.
- **Required APIs:** `POST /goals/:goalId/ai/task-suggestions`, `GET /goals/:goalId/ai/task-suggestions`, `POST /ai/recommendations/:id/accept`, `POST /ai/recommendations/:id/dismiss` — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** New `AIRecommendation` table (`AIRecommendationType`/`AIRecommendationStatus` enums) — see [10-database-design.md](10-database-design.md).
- **UI impact:** "AI Suggestions" section on `/dashboard/goals/[id]` — a "Suggest tasks with AI" action when no suggestion is pending; when one is pending, each suggestion's title/description alongside its reason/confidence/alternatives, a checkbox per suggestion, "Accept selected" and "Dismiss" actions.
- **AI impact:** This *is* the AI feature — first real consumer of `adr/0006`'s `AIProvider` interface.
- **Testing strategy:** Unit (`ai-provider.contract.spec.ts` runs the same behavioral contract against both `AnthropicProvider`/`OpenAIProvider` with vendor SDKs mocked; per-provider specs for structured-output parsing and error mapping; `AIRecommendationsService` spec — mocked `AIProvider`+Prisma+`GoalsService`/`TasksService` — covering generate success/provider-failure/malformed-output, accept, dismiss, cross-owner 404), DTO validation, integration/e2e (`ai.e2e-spec.ts` — Docker Postgres, but `AI_PROVIDER_TOKEN` overridden with an in-test fake provider so **no vendor API keys are needed**, a genuine improvement over Phase 1-5's e2e posture).
- **Migration requirements:** Adds `AIRecommendation` to the existing Prisma schema; same unresolved Docker-dependent no-migration-ever-generated gap carried forward from Phases 1-5.
- **Observability impact:** Every generate attempt is persisted (`PENDING`/`ACCEPTED`/`DISMISSED`/`FAILED`) — a failed AI call is traceable, not silently swallowed; accept reuses `TasksService.create` so the Phase 3 rollup keeps firing for AI-originated tasks exactly as for manually-created ones.
- **Security considerations:** `JwtAuthGuard` + ownership-forced `ownerId` on every route, same 404-not-403 pattern as every prior module; a tighter `@Throttle` (10/min) on the generate endpoint beyond the global default, since LLM calls are slow and cost money per request; every vendor call is wrapped in an explicit ~20s `AbortController` timeout, independent of SDK defaults; the active provider's API key is required at boot (fail-fast), never silently absent; vendor SDK errors are mapped to a generic message before ever reaching a response body. New ground versus every prior phase: a goal's title/description/task titles are sent to a third-party LLM — documented as the accepted trade-off of shipping any cloud-LLM feature, no new PII beyond what the user already entered — see [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `09-ai-architecture.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `16-roadmap.md`, `21-decision-log.md`, `27-backlog.md`.
- **Acceptance criteria:**
  - [x] `AIProvider.complete()` implemented against both Anthropic and OpenAI, proven via a shared contract test
  - [x] Goal → task-breakdown suggestions generated, persisted as `PENDING`, never auto-creating a `Task`
  - [x] Accept/dismiss implemented; accept reuses `TasksService.create`; re-responding to a non-`PENDING` recommendation is rejected
  - [x] Every suggestion carries reason/confidence/alternatives; every recommendation carries its context — passes `evaluation/ai-feature-quality-bar.md`'s 8 criteria
  - [x] Provider failure and malformed structured output both degrade to a persisted `FAILED` record + a clean error, never a fabricated suggestion
  - [x] Unit tests passing (35 in `@pee/ai` — 183 total across the workspace)
  - [x] Integration/e2e tests written; needs Docker only, not vendor API keys (fake-provider override) — not run in the authoring sandbox (no Docker there)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new/edited file stays under ~300 lines (largest new file: `ai-recommendations.service.ts`, 212 lines)
  - [ ] No initial Prisma migration generated yet — requires Docker (carried forward from Phases 1-5)
  - [ ] A real network smoke test against the live Anthropic/OpenAI APIs — requires real vendor credentials, not exercised by any automated test; `stream`/`embed` methods, automatic multi-provider failover, additional AI-native features, AI-recommendation sync coverage, usage/cost tracking — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 7 — Analytics

- **Objective:** Give a user visibility into their own productivity data — status breakdowns, completion velocity, and time actually tracked — as a read-only reporting layer over Phases 2-6's existing data. Unlike every prior phase, this phase had no pre-existing scope in the roadmap; the objective and shape were derived this session from the user's literal exit criterion ("metrics live in `dashboard/METRICS.md`") plus the data the product already has.
- **Current state:** Phases 1-6 complete; goal/task status, time-tracking sessions, the execution-event log, and AI-recommendation outcomes all exist as raw rows, but nothing aggregates them for the user.
- **Desired state:** A NestJS `analytics` module exposing three owner-scoped read endpoints, rendered on a new `apps/web` dashboard page, with `dashboard/METRICS.md` documenting the resulting live metrics contract.
- **Required APIs:** `GET /analytics/summary`, `GET /analytics/velocity`, `GET /analytics/time-tracking` — see [11-api-contract.md](11-api-contract.md).
- **Database impact:** One composite index (`ExecutionEvent.[ownerId, createdAt]`) — no new table. See [10-database-design.md](10-database-design.md).
- **UI impact:** New `/dashboard/analytics` page (summary/velocity/time-tracking tables), linked from `/dashboard`.
- **AI impact:** None — summary includes AI-recommendation acceptance rate as one metric among several, but introduces no new AI capability.
- **Testing strategy:** Unit (three services, mocked Prisma) + DTO validation, one e2e spec seeding two owners via the real HTTP API and asserting no cross-owner leakage (requires Docker Postgres).
- **Migration requirements:** Adds one index to the existing `ExecutionEvent` table; no migration file generated yet — same carried-forward Docker gap as every prior phase.
- **Observability impact:** None new — read-only endpoints, no state change to audit.
- **Security considerations:** Identical `JwtAuthGuard` + ownership-scoping pattern as every prior module; every query takes `ownerId` as an explicit service-method parameter, scoped from the JWT, never a request parameter. No new authorization pattern. See [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `16-roadmap.md`, `21-decision-log.md`, `27-backlog.md`, `dashboard/METRICS.md`.
- **Acceptance criteria:**
  - [x] `GET /analytics/summary` returns status breakdowns, total time tracked, and AI-recommendation acceptance rate, scoped to the caller
  - [x] `GET /analytics/velocity` returns daily task/goal completion buckets over a capped (1-90 day) trailing window
  - [x] `GET /analytics/time-tracking` returns tracked-seconds totals grouped by goal or project, over a capped (1-365 day) trailing window
  - [x] `dashboard/METRICS.md` rewritten to document the live metrics contract — the literal exit criterion
  - [x] Unit tests passing (25 in `@pee/analytics` — 208 total across the workspace)
  - [x] Integration/e2e test written; needs Docker only — not run in the authoring sandbox (no Docker there)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new/edited file stays under ~300 lines (largest new file: `apps/web/app/dashboard/analytics/page.tsx`, 104 lines)
  - [ ] No initial Prisma migration generated yet — requires Docker (carried forward from Phases 1-6)
  - [ ] Materialized analytics rollups, charting/visualization upgrade, analytics sync coverage — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 8 — Desktop

- **Objective:** Ship a desktop client that reuses the same backend API, the same visual conventions, and `packages/local-client` (Phase 5's reusable SQLite reference client) with no rewrite — the exit criterion this phase is literally scoped against.
- **Current state:** `@pee/local-client` existed but was genuinely unconsumed by any shipped product surface; no Electron/Tauri tooling existed anywhere in the repo.
- **Desired state:** A new `apps/desktop` Electron app whose main process runs `@pee/local-client`'s `LocalStore`/`SyncClient` unmodified for offline-capable Project/Goal/Task CRUD + sync, and whose renderer reuses the same REST contracts `apps/web` already calls (`services/auth`/`services/execution`/`services/ai`/`services/analytics`) for the surfaces outside `@pee/local-client`'s sync registry.
- **Required APIs:** None new — reuses `POST /auth/login|refresh|logout`, `GET /auth/me`, `POST /tasks/:taskId/execution/start|complete`, `POST /goals/:goalId/ai/task-suggestions`, `POST /ai/recommendations/:id/accept|dismiss`, `GET /analytics/summary|velocity|time-tracking`, and `POST /sync/pull|push` (the latter via `@pee/local-client`'s `SyncClient`, not a direct call).
- **Database impact:** None — no Postgres schema change; `@pee/local-client`'s existing SQLite schema is consumed as-is, with no new tables.
- **UI impact:** A new Electron renderer (`apps/desktop/src`) — Login, Projects (list/create), Goal detail (goals+tasks for a project, Start/Complete controls, AI suggestions panel), Analytics (read-only) — reusing `apps/web`'s Tailwind baseline and utility-class conventions, not its Server Components (architecturally incompatible with an offline-first client).
- **AI impact:** None new — the existing goal → task-breakdown feature (Phase 6) is exposed via a passthrough IPC handler, online-only.
- **Testing strategy:** Unit tests for every IPC handler module (mocked `LocalStore`/`SyncClient`/`AuthSession`) and for the Login/SyncStatusBadge renderer components (Vitest+RTL); a Playwright Electron e2e smoke test that launches the *actual built app* and asserts the login screen renders — genuinely executed in the authoring sandbox (no Docker needed, since it's pure SQLite/Electron), unlike every prior phase's Docker-dependent e2e.
- **Migration requirements:** None — no Postgres schema change. `@pee/local-client`'s SQLite schema is unchanged; its existing first-run `prisma db push` bootstrap (mirrored in `local-store-factory.ts`) was verified end-to-end in this sandbox, producing a real SQLite file with all 6 expected tables.
- **Observability impact:** None new.
- **Security considerations:** Electron hardening baseline (`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, narrow typed preload bridge); refresh token persisted via OS-keychain-backed `safeStorage` (plaintext fallback if unavailable, documented); local SQLite file remains unencrypted at rest — the exact gap Phase 5/12-security.md flagged as "revisit before Phase 8 ships this file to end-user machines," now genuinely live rather than hypothetical. See [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `12-security.md`, `16-roadmap.md`, `20-known-issues.md`, `21-decision-log.md`, `27-backlog.md`, `adr/0007-desktop-shell-electron.md`.
- **Acceptance criteria:**
  - [x] `apps/desktop` Electron app built; main process imports `@pee/local-client`'s `LocalStore`/`SyncClient` with zero modification
  - [x] Offline-capable Project/Goal/Task CRUD via IPC, owner-scoped, backed by a real local SQLite file (verified: bootstrap + all 6 tables created in this sandbox)
  - [x] Manual + backgrounded (30s interval) sync via the unmodified `SyncClient`, with refresh-on-401 retry
  - [x] Execution start/complete, AI suggestions, and analytics exposed as online-only passthroughs to the existing REST contracts
  - [x] Unit tests passing (31 in `@pee/desktop` — 239 total across the workspace)
  - [x] Playwright Electron e2e smoke test written **and actually run** in this sandbox (launches the built app, confirms the login screen renders) — the first e2e in this project not blocked by the Docker gap
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new/edited file stays under ~300 lines (largest: `electron/main/auth/auth-session.ts`, 139 lines)
  - [ ] Code signing, auto-update, cross-platform CI packaging matrix — explicitly deferred, see [27-backlog.md](27-backlog.md)
  - [ ] Local SQLite file-at-rest encryption — explicitly deferred, see [27-backlog.md](27-backlog.md)

## Phase 9 — Mobile

- **Objective:** Ship a mobile client with the same reuse constraint as Desktop — a mobile shell whose runtime can host `@pee/local-client` *or an equivalent* without a rewrite — while remaining an honest port where literal reuse isn't technically possible.
- **Current state:** No mobile tooling existed anywhere in the repo. Confirmed by reading the code that `@pee/local-client`'s `LocalStore` (Prisma-based) cannot run unmodified on React Native — Prisma's query engine has no Android/iOS binary target, and Hermes/JSC is not a Node.js runtime.
- **Desired state:** A new `apps/mobile` Expo/React Native app with a `MobileStore` (expo-sqlite-backed, same table shapes and method surface as `LocalStore`) and a `MobileSyncClient` (a line-for-line port of `SyncClient`'s pull/push algorithm) providing offline-capable Project/Goal/Task CRUD + sync, with `@pee/types` and the `services/sync` REST contract reused completely unmodified. Execution/AI/analytics stay online-only, matching Desktop's scope boundary.
- **Required APIs:** None new — reuses `POST /auth/login|refresh|logout`, `GET /auth/me`, `POST /tasks/:taskId/execution/start|complete`, `POST /goals/:goalId/ai/task-suggestions`, `POST /ai/recommendations/:id/accept|dismiss`, `GET /analytics/summary|velocity|time-tracking`, and `POST /sync/pull|push`.
- **Database impact:** None — no Postgres schema change. `MobileStore`'s SQLite tables mirror `packages/local-client/prisma/schema.prisma` field-for-field but are a separate, hand-written SQL schema (`apps/mobile/src/db/schema.ts`), not a shared Prisma client.
- **UI impact:** A new React Native renderer (`apps/mobile/src`) — Login, Projects (list/create), Goal detail (goals+tasks, Start/Complete controls, AI suggestions panel), Analytics (read-only) — reusing `apps/web`'s Tailwind conventions via NativeWind.
- **AI impact:** None new — the existing goal → task-breakdown feature (Phase 6) is exposed via `RemoteClient`, online-only.
- **Testing strategy:** Jest + `@testing-library/react-native` unit tests for `MobileStore`/`MobileSyncClient` (against a real embedded SQLite via Node's built-in `node:sqlite`, not a hand-rolled mock), `MobileAuthSession`, and `LoginScreen` — 17 tests, genuinely run and passing. A Detox e2e spec was written and CI-wired but — unlike Desktop's Playwright/Electron e2e — could not be run in this sandbox (no Android emulator/iOS Simulator available); honestly documented as unrun, not claimed as verified.
- **Migration requirements:** None — no Postgres schema change. `MobileStore`'s schema bootstrap runs idempotent `CREATE TABLE IF NOT EXISTS` statements on every launch, needing no migration history.
- **Observability impact:** None new.
- **Security considerations:** `expo-secure-store` (iOS Keychain/Android Keystore-backed) for refresh-token custody, mirroring Desktop's `safeStorage` pattern; `ownerId` always derived from the authenticated session, never from a caller-supplied value; local SQLite file remains unencrypted at rest — same carried-forward gap as Desktop's local file, now shipping to a second client. See [12-security.md](12-security.md).
- **Documentation updates:** This entry, `08-backend-guidelines.md`, `12-security.md`, `16-roadmap.md`, `20-known-issues.md`, `21-decision-log.md`, `27-backlog.md`, `adr/0008-mobile-local-storage.md`.
- **Acceptance criteria:**
  - [x] `apps/mobile` Expo/React Native app built; `MobileStore`/`MobileSyncClient` port `LocalStore`/`SyncClient`'s behavior faithfully onto expo-sqlite (documented rationale in `adr/0008` for why literal reuse isn't possible on this runtime)
  - [x] Offline-capable Project/Goal/Task CRUD, owner-scoped, backed by a real on-device SQLite file
  - [x] Manual + backgrounded (30s interval) sync via the ported algorithm, with refresh-on-401 retry
  - [x] Execution start/complete, AI suggestions, and analytics exposed as online-only passthroughs to the existing REST contracts
  - [x] Unit tests passing (17 in `@pee/mobile` — 256 total across the workspace)
  - [x] `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace
  - [x] Every new/edited file stays under ~300 lines (largest: `screens/GoalDetailScreen.tsx`, 138 lines)
  - [ ] Detox e2e spec written and CI-wired but **not run** in this sandbox — no Android emulator/iOS Simulator available; honestly documented, not claimed as verified
  - [ ] Code signing, EAS cloud build, local SQLite file-at-rest encryption — explicitly deferred, see [27-backlog.md](27-backlog.md)

## What belongs here once written

For each defined feature/epic, per `SYSTEM_PROMPT.md` §72-73 (`System_Prompt/Part5.md`):

- Objective, current state, desired state
- Required APIs, database impact, UI impact, AI impact
- Testing strategy, migration requirements, observability impact, security considerations
- Documentation updates required
- Business value, success metrics, risks, estimated implementation order

## Process

A PRD entry is written during Epic Planning (§72) — before implementation begins, never retroactively. Use [templates/epic-template.md](../templates/README.md) and [templates/feature-spec-template.md](../templates/README.md) once available (Group 6).
