# 17 — Phase Status

**Priority 2 load** — read every session (`claude/STARTUP.md`).

## Current phase

**Phase 6 — AI Integration. Complete (2026-07-18).**

Phase 0 (EOS bootstrap), Phase 0.5 (architecture ADRs), Phase 1 (Authentication), Phase 2 (Projects), Phase 3 (Planning Engine), Phase 4 (Execution Engine), and Phase 5 (Memory Engine) are complete. Phase 6 is implemented: `services/ai` (NestJS module — `AIProvider` interface exposing `complete()` only, `AI_PROVIDER`-selected DI factory constructing only the active vendor's implementation, `AnthropicProvider`/`OpenAIProvider` proven against a shared behavioral contract test) plus its first real consumer — goal → task-breakdown suggestions, gated behind explicit human accept/dismiss, every suggestion carrying reason/confidence/alternatives, every recommendation carrying the context the model saw. This is `adr/0006`'s deferred provider abstraction, designed, working, and actually consumed — not just an interface. See [02-prd.md](02-prd.md) for the feature spec and acceptance criteria.

## Group status

| Group | Contents | Status |
|---|---|---|
| 0 | Folder skeleton + purpose READMEs + root CLAUDE.md | Done |
| 1 | Runtime documents (`claude/`) | Done |
| 2 | Memory bank (`project-memory-bank/00-29`) | Done |
| 3 | ADR template + seed ADR-0001 | Done |
| 4 | Playbooks | Done |
| 5 | Functional `.claude/commands/` + `commands/` pointer | Done |
| 6 | Templates | Done |
| 7 | Checklists | Done |
| 8 | Design system spec | Done |
| 9 | Engineering standards (`docs/standards/`) | Done |
| 10 | Session management files | Done |
| 11 | Dashboard files | Done |
| 12 | Evaluation + `docs/` navigation guide | Done |

## Phase 0.5 — Architecture ADRs

| ADR | Decision | Status |
|---|---|---|
| 0002 | Backend language/framework: TypeScript, NestJS, modular monolith | Accepted |
| 0003 | Database: PostgreSQL + SQLite (local), Prisma | Accepted |
| 0004 | Infrastructure: Docker/docker-compose, K8s/Terraform deferred, GitHub Actions | Accepted |
| 0005 | Auth: first-party NestJS module + Auth.js, JWT sessions | Accepted |
| 0006 | AI: first-party provider interface, Claude + OpenAI | Accepted |

## Phase 1 — Authentication

| Deliverable | Status |
|---|---|
| npm workspaces scaffold (`packages/*`, `services/*`, `apps/*`) | Done |
| `packages/database` (Prisma schema: `User`, `RefreshToken`, `AuthAuditLog`) | Done |
| `packages/types` (shared auth DTOs) | Done |
| `services/auth` (register/login/refresh/logout/me, argon2, rotation+reuse detection, audit log, rate limiting) | Done |
| `services/api` (composition root, helmet, global validation, throttler guard) | Done |
| `apps/web` (Next.js + Auth.js login/register/dashboard, BFF token custody) | Done |
| Unit tests (26, passing) | Done |
| Integration/e2e tests (Docker Postgres required) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Memory-bank documentation sweep | Done |

## Phase 2 — Projects

| Deliverable | Status |
|---|---|
| `Project` model added to `packages/database` (Prisma) | Done |
| Shared project types (`packages/types`) | Done |
| `services/projects` (create/list/get/update/archive, ownership enforcement, pagination/filter/search) | Done |
| `services/api` wiring (`ProjectsModule` imported) | Done |
| `apps/web` (project list/create/edit pages, linked from dashboard) | Done |
| Unit + DTO tests (20, passing) | Done |
| Frontend unit tests (Vitest+RTL, 5 including Phase 1's, passing) | Done |
| Integration/e2e tests (Docker Postgres required) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Memory-bank documentation sweep | Done |

## Phase 3 — Planning Engine

| Deliverable | Status |
|---|---|
| `Goal`/`Task` models added to `packages/database` (Prisma) | Done |
| Shared goal/task types (`packages/types`) | Done |
| `services/planning` (goal/task CRUD, nested ownership, closed-loop progress rollup) | Done |
| `services/api` wiring (`PlanningModule` imported) | Done |
| `apps/web` (goal list/create/detail/edit pages, inline task management, linked from project detail) | Done |
| Unit + DTO tests (31, passing) | Done |
| Frontend unit tests (Vitest+RTL, 2 new specs, 10 total including prior phases, passing) | Done |
| Integration/e2e tests (Docker Postgres required) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Every new file under ~300 lines | Done (largest: `goals.service.ts`, 151 lines) |
| Memory-bank documentation sweep | Done |

## Phase 4 — Execution Engine

| Deliverable | Status |
|---|---|
| `TaskExecutionSession`/`ExecutionEvent` models added to `packages/database` (Prisma) | Done |
| Shared execution types + event payload types (`packages/types`) | Done |
| `@nestjs/event-emitter` wired: `@pee/planning` emits, `@pee/execution` listens (no cyclic module dependency) | Done |
| `services/execution` (start/complete endpoints, per-goal activity timeline, global active-sessions dashboard) | Done |
| `services/api` wiring (`EventEmitterModule.forRoot()` + `ExecutionModule` imported) | Done |
| `apps/web` (Start/Complete controls + activity timeline on goal detail, new `/dashboard/execution` page, linked from dashboard) | Done |
| Unit tests (12 in `@pee/execution`, plus 3 new assertions in existing `@pee/planning` specs — 101 total) | Done |
| Integration/e2e tests (Docker Postgres required) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Every new/edited file under ~300 lines | Done (largest new file: `execution-events.service.ts`, 122 lines) |
| Memory-bank documentation sweep | Done |

## Phase 5 — Memory Engine

| Deliverable | Status |
|---|---|
| Composite `[ownerId, updatedAt]` indexes on `Project`/`Goal`/`Task`; `version` wired up as a live increment on every write | Done |
| Shared sync types (`packages/types`) | Done |
| `services/sync` (`POST /sync/pull`, `POST /sync/push`; registry-driven across the 3 bidirectional entities; version-guard + last-write-wins conflict resolution) | Done |
| `services/api` wiring (`SyncModule` imported) | Done |
| `packages/local-client` (SQLite Prisma schema, `LocalStore`, `SyncClient`) | Done |
| Unit tests (28 in `@pee/sync`, 13 in `@pee/local-client`, plus new create/update assertions in `@pee/projects`/`@pee/planning` specs — 148 total across the workspace) | Done |
| Integration/e2e tests (`services/sync/test/sync.e2e-spec.ts`, `packages/local-client/test/sync-roundtrip.e2e-spec.ts` — Docker Postgres required for the server half; the SQLite half needs no infra) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Every new/edited file under ~300 lines | Done (largest new file: `local-store.ts`, 159 lines) |
| Memory-bank documentation sweep | Done |

## Phase 6 — AI Integration

| Deliverable | Status |
|---|---|
| `AIRecommendation` model added to `packages/database` (Prisma) | Done |
| Shared AI types (`packages/types`) | Done |
| `services/ai` — `AIProvider` interface, `AnthropicProvider`/`OpenAIProvider`, config-selected DI factory | Done |
| First feature: goal → task-breakdown suggestions (generate/list/accept/dismiss), human-approval gate before any `Task` is created | Done |
| `services/api` wiring (`AIModule` imported) | Done |
| `apps/web` (AI Suggestions panel on the goal detail page — suggest/accept-selected/dismiss) | Done |
| Unit tests (35 in `@pee/ai` — provider contract, per-provider error mapping, recommendations service, DTO validation — 183 total across the workspace) | Done |
| Integration/e2e tests (`services/ai/test/ai.e2e-spec.ts` — Docker Postgres required, but vendor API keys are not, via an in-test fake-provider override) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Every new/edited file under ~300 lines | Done (largest new file: `ai-recommendations.service.ts`, 212 lines) |
| Memory-bank documentation sweep | Done |

## Next phase

Phase 0, 0.5, 1, 2, 3, 4, 5, and 6 are done. **Phase 7 — Analytics** is next, once scoped (`16-roadmap.md`). Before then: generate and apply the first Prisma migration and run the Docker-dependent e2e suites at least once — see [20-known-issues.md](20-known-issues.md).

Detail: [18-current-state.md](18-current-state.md), [19-active-work.md](19-active-work.md), [29-next-task.md](29-next-task.md).
