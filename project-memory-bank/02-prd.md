# 02 — Product Requirements Document

**Status: Phase 3 (Planning Engine) written and implemented, 2026-07-18.**

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

## What belongs here once written

For each defined feature/epic, per `SYSTEM_PROMPT.md` §72-73 (`System_Prompt/Part5.md`):

- Objective, current state, desired state
- Required APIs, database impact, UI impact, AI impact
- Testing strategy, migration requirements, observability impact, security considerations
- Documentation updates required
- Business value, success metrics, risks, estimated implementation order

## Process

A PRD entry is written during Epic Planning (§72) — before implementation begins, never retroactively. Use [templates/epic-template.md](../templates/README.md) and [templates/feature-spec-template.md](../templates/README.md) once available (Group 6).
