# 18 — Current State

**Priority 3 load** — read every session (`claude/STARTUP.md`). This is the "implementation status" save-state file.

## What exists in the repo right now

The full Engineering Operating System, complete:

- `CLAUDE.md` — root entry-point pointer.
- `System_Prompt/Part1-6.md` — the product constitution (`SYSTEM_PROMPT.md`), untouched.
- `EngineeringOperatingSystem.md` — the bootstrap instruction, untouched.
- `claude/` — 10 runtime docs (STARTUP, EXECUTION, MEMORY, FRONTEND, BACKEND, TESTING, SECURITY, RELEASE, CODE_REVIEW, DOCUMENTATION) + README.
- `.claude/commands/` — 9 functional slash-commands (`/implement-feature`, `/fix-bug`, `/create-api`, `/refactor-module`, `/performance-review`, `/security-review`, `/release`, `/frontend-workflow`, `/backend-workflow`), each wrapping the matching playbook.
- `commands/` — pointer doc to `.claude/commands/`.
- `project-memory-bank/` — all 30 files (00-29) + README. Vision/principles/contract content summarized from SYSTEM_PROMPT.md with `§NN` references; architecture/stack/DB/API/AI files now reflect resolved decisions (see below); operational trackers (17-21, 27-29) reflect real state.
- `adr/` — template + ADR-0001 (adopting the EOS itself) + ADR-0002 through 0006 (backend, database, infrastructure, auth, AI-provider decisions).
- `playbooks/` — 9 workflow procedures.
- `templates/` — 13 reusable document shapes.
- `checklists/` — 9 executable review checklists.
- `design-system/` — 6 spec files (tokens, layout/nav, components, states, accessibility/themes, interaction principles) — categories and rules defined, concrete values TBD until first frontend work.
- `docs/standards/` — 7 cross-cutting standards files (API, database, performance, observability, git/releases, CI/CD, dev experience).
- `docs/README.md` — full repo navigation guide.
- `session/` — 5 live session-tracking files.
- `dashboard/` — 6 human-facing status files.
- `evaluation/` — AI feature quality bar (`ai-feature-quality-bar.md`).

## Product code now exists — Phase 1 (Authentication) + Phase 2 (Projects) + Phase 3 (Planning Engine) + Phase 4 (Execution Engine), 2026-07-17/18

- **`package.json`, `tsconfig.base.json`** at root — npm workspaces (`packages/*`, `services/*`, `apps/*`).
- **`packages/database`** (`@pee/database`) — Prisma schema (`User`, `RefreshToken`, `AuthAuditLog`, `Project`, `Goal`, `Task`, `TaskExecutionSession`, `ExecutionEvent`), `PrismaService`/`PrismaModule`.
- **`packages/types`** (`@pee/types`) — shared auth DTOs (`RegisterRequest`, `LoginRequest`, `AuthTokens`, `UserProfile`), project DTOs (`CreateProjectRequest`, `UpdateProjectRequest`, `ProjectResponse`, `ListProjectsQuery`), goal/task DTOs (`CreateGoalRequest`, `UpdateGoalRequest`, `GoalResponse`, `GoalProgress`, `ListGoalsQuery`, `CreateTaskRequest`, `UpdateTaskRequest`, `TaskResponse`, `ListTasksQuery`), execution DTOs (`ExecutionEventResponse`, `TaskExecutionSessionResponse`, `ActiveExecutionResponse`, plus the `task.status_changed`/`goal.status_changed` event-name constants and payload types shared between emitter and listener), and `PaginatedResponse<T>`.
- **`services/auth`** (`@pee/auth`) — `AuthModule`/`AuthController`/`AuthService`, `TokenService` (JWT access + opaque hashed refresh), `PasswordService` (argon2), `AuditLogService`, `JwtStrategy`/`JwtAuthGuard`/`CurrentUser` (the latter two exported for reuse by other modules). Tests: 4 unit spec files (24 tests), 1 e2e spec (register→login→refresh→logout flow, requires Docker Postgres).
- **`services/projects`** (`@pee/projects`) — `ProjectsModule`/`ProjectsController` (create/list/get/update/archive, all `JwtAuthGuard`-protected)/`ProjectsService` (Prisma access + ownership enforcement, 404-not-403 on cross-user access). Tests: 2 unit spec files (20 tests), 1 e2e spec (create→list→get→update→archive flow + cross-user 404 check, requires Docker Postgres).
- **`services/planning`** (`@pee/planning`) — `PlanningModule` (imports `ProjectsModule`), `goals/` (`GoalsService`, `ProjectGoalsController`, `GoalsController`) and `tasks/` (`TasksService`, `GoalTasksController`, `TasksController`). `TasksService` calls `GoalsService.recalculateProgress` after every mutation, automatically rolling task completion up into the parent goal's `status`/`progress` — the closed execution loop. Both services also `emit()` `task.status_changed`/`goal.status_changed` via `EventEmitter2` on every status change (Phase 4 addition — additive, no existing method's return value or errors changed). Tests: 3 unit spec files (34 tests total incl. DTO validation and the new emit assertions), 1 e2e spec (goal/task creation → status rollup through COMPLETED → archive, requires Docker Postgres).
- **`services/execution`** (`@pee/execution`) — `ExecutionModule` (imports `PlanningModule` one-directionally), `events/` (`ExecutionEventsService` — `@OnEvent` listeners that persist `ExecutionEvent` rows, `listGoalActivity`, `listActiveSessions`; `GoalActivityController`) and `sessions/` (`TaskSessionsService` — `startTask`/`completeTask`, reusing `TasksService.getOne`/`update`; `TaskSessionsController`; `ActiveExecutionController`). No import in either direction between `@pee/planning` and `@pee/execution` beyond planning→projects and execution→planning — the emitter/listener connection is via `@nestjs/event-emitter`, not a module import, so events fire regardless of which endpoint changed a status. Tests: 2 unit spec files (12 tests), 1 e2e spec (start→complete→activity-timeline→active-list flow, requires Docker Postgres).
- **`services/api`** (`@pee/api`) — composition root (`main.ts`, `app.module.ts` importing `EventEmitterModule.forRoot()` + `AuthModule` + `ProjectsModule` + `PlanningModule` + `ExecutionModule`, `HealthController`). Test: 1 unit spec.
- **`apps/web`** (`web`) — Next.js 14 App Router + Auth.js v5: `/login`, `/register`, `/dashboard`, `/dashboard/projects` (list/new/[id] edit), `/dashboard/projects/[id]/goals` (list/new), `/dashboard/goals/[id]` (detail — progress, task list, inline task creation, Start/Complete controls, activity timeline, mark-done/archive), `/dashboard/goals/[id]/edit`, `/dashboard/execution` (global "Active Work" dashboard — every currently-running task across every project/goal), `middleware.ts` route protection, `auth.ts` (Credentials provider + refresh-on-expiry `jwt` callback), server-only `lib/api-client.ts` (auth + Bearer-authenticated project calls), `lib/planning-api-client.ts` (goal/task calls), and `lib/execution-api-client.ts` (start/complete/activity/active-list calls — all three client files reuse the same `authHeaders`/`baseUrl` helpers), `components/ProjectForm.tsx`/`GoalForm.tsx`/`TaskForm.tsx` (all `onSubmit`+`useState`, not `useFormState`, which needs Next's bundled React and isn't unit-testable under plain Vitest). Tests: Vitest+RTL unit (10 tests total), Playwright e2e (`login.spec.ts`, `projects.spec.ts`, `planning.spec.ts`, `execution.spec.ts` — requires the full stack running).
- **`infrastructure/docker/docker-compose.dev.yml`** — Postgres (dev + test) for local use.
- **`.github/workflows/ci.yml`** — install, Prisma generate/migrate, lint, typecheck, unit tests, auth e2e, projects e2e, planning e2e, execution e2e, build, then boots the API + web app and runs the Playwright suite against them.

Verified in the authoring environment (no Docker available there): `npm install`, `npm run build`, `npm run typecheck`, `npm run lint -w web`, and all unit tests pass (24 in `@pee/auth`, 1 in `@pee/api`, 20 in `@pee/projects`, 34 in `@pee/planning`, 12 in `@pee/execution`, 10 in `web` — 101 total). Integration/e2e specs requiring a live Postgres are written and wired into CI but were **not executed** in this sandbox — see [20-known-issues.md](20-known-issues.md). **No Prisma migration has ever been generated** (`packages/database/prisma/migrations/` doesn't exist) — also requires Docker, also tracked in known-issues.

## What does not exist yet

- Memory/Analytics/AI-integration/Desktop/Mobile/Enterprise product code (Phases 5-10).
- OAuth social login, email verification, password reset — explicitly deferred, see [27-backlog.md](27-backlog.md).
- Multi-user project/goal sharing, project templates/tags, task dependencies/scheduling, AI-assisted plan generation, a general non-status-change domain-entity audit trail (create/rename actions), task session pause/resume — explicitly deferred, see [27-backlog.md](27-backlog.md).
- Concrete design-system token values (categories/rules only) — UI so far is deliberately minimal, not a full design-system build-out.
- The local SQLite ↔ Postgres sync protocol (deferred per `adr/0003` to whichever phase first needs real offline behavior).

## Architecture

**Resolved 2026-07-17 (`adr/0002`-`adr/0006`); Phase 1 (Authentication) implemented against it same day, Phase 2 (Projects), Phase 3 (Planning Engine), and Phase 4 (Execution Engine) implemented 2026-07-18.** Backend: TypeScript/NestJS modular monolith. Storage: PostgreSQL (implemented) + SQLite local (not yet needed). Infra: Docker/docker-compose (implemented for dev/CI), GitHub Actions (implemented), K8s/Terraform deferred. Auth: first-party NestJS module + Auth.js, JWT sessions — implemented. AI: first-party provider interface, Claude + OpenAI — not yet implemented (Phase 6). Full detail and rationale: [03-system-architecture.md](03-system-architecture.md) and `adr/0002`-`adr/0006`.
