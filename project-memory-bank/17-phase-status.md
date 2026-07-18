# 17 — Phase Status

**Priority 2 load** — read every session (`claude/STARTUP.md`).

## Current phase

**Phase 10 — Enterprise. Complete (2026-07-18).**

Phase 0 (EOS bootstrap), Phase 0.5 (architecture ADRs), Phase 1 (Authentication), Phase 2 (Projects), Phase 3 (Planning Engine), Phase 4 (Execution Engine), Phase 5 (Memory Engine), Phase 6 (AI Integration), Phase 7 (Analytics), Phase 8 (Desktop), and Phase 9 (Mobile) are complete. Phase 10 is implemented: a new `Organization`/`Membership` model (`adr/0009`) — every user gets an invisible personal org + `OWNER` membership at registration; `Project` gains `organizationId`, `Goal`/`Task` denormalize it from their parent; any org member (`MEMBER`+) can read/create/update, only the creator or an `ADMIN`/`OWNER` can archive/delete. A new `services/organizations` (`@pee/organizations`) module owns it. RBAC retrofits `ProjectsService`/`GoalsService`/`TasksService` only — `services/execution`/`services/ai`/`services/sync` needed zero code changes since they delegate writes through those same services. SSO is additive: OIDC via Auth.js's native `type: 'oidc'` provider (this backend only provisions users after Auth.js's own verified exchange), SAML via a self-built SP (`@node-saml/node-saml`) behind an OAuth2-shaped façade since Auth.js has no native SAML provider type. Both are feature-flagged off by default. See [02-prd.md](02-prd.md) for the feature spec and acceptance criteria.

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

## Phase 7 — Analytics

| Deliverable | Status |
|---|---|
| Composite `[ownerId, createdAt]` index added to `ExecutionEvent` (`packages/database`) — the only schema change this phase, no new model | Done |
| Shared analytics types (`packages/types`) | Done |
| `services/analytics` — `SummaryService`/`VelocityService`/`TimeTrackingService`, each querying `@pee/database`'s `PrismaService` directly (documented read-only-join carve-out, no `@pee/planning`/`@pee/execution`/`@pee/ai` dependency) | Done |
| `AnalyticsController` — `GET /analytics/summary`, `GET /analytics/velocity`, `GET /analytics/time-tracking`, all `JwtAuthGuard`-protected and owner-scoped from the JWT | Done |
| `services/api` wiring (`AnalyticsModule` imported) | Done |
| `apps/web` (`/dashboard/analytics` page — summary/velocity/time-tracking tables, linked from the main dashboard) | Done |
| `dashboard/METRICS.md` rewritten with the live product-analytics metrics contract — the phase's literal exit criterion | Done |
| Unit tests (25 in `@pee/analytics` — summary/velocity/time-tracking services, DTO validation — 208 total across the workspace) | Done |
| Integration/e2e test (`services/analytics/test/analytics.e2e-spec.ts` — Docker Postgres required, seeds real data via the HTTP API for two owners and asserts no cross-owner leakage) | Written, wired into CI — not run in authoring sandbox (no Docker there) |
| `npm run build` / `typecheck` / `lint` clean | Done |
| Every new/edited file under ~300 lines | Done (largest new file: `apps/web/app/dashboard/analytics/page.tsx`, 104 lines) |
| Memory-bank documentation sweep | Done |

## Phase 8 — Desktop

| Deliverable | Status |
|---|---|
| `adr/0007` — Electron chosen over Tauri, so `@pee/local-client` runs unmodified in the main process | Done |
| New `apps/desktop` (`@pee/desktop`) Electron app: `package.json`, `electron.vite.config.ts`, `electron-builder.yml`, Tailwind config mirroring `apps/web`'s | Done |
| Main process: `local-store-factory.ts` (first-run SQLite bootstrap via `prisma db push`), `auth/auth-session.ts`+`auth-ipc.ts` (login/refresh/logout, `safeStorage` token custody) | Done |
| IPC: `projects-ipc.ts`/`goals-ipc.ts`/`tasks-ipc.ts` (offline CRUD via `LocalStore`), `sync-ipc.ts` (manual + 30s background sync via unmodified `SyncClient`), `remote-ipc.ts` (execution/AI/analytics online-only passthroughs) | Done |
| Preload bridge (`electron/preload/index.ts`) — narrow typed `contextBridge` surface, `contextIsolation`/`sandbox` enabled, no raw `ipcRenderer` exposed | Done |
| Renderer (`src/`): Login, Projects, GoalDetail (+ AI suggestions panel), Analytics, SyncStatusBadge — React + Vite, reusing `apps/web`'s Tailwind conventions | Done |
| Unit tests (31 in `@pee/desktop` — IPC handlers with mocked `LocalStore`/`SyncClient`/`AuthSession`, plus Login/SyncStatusBadge renderer specs — 239 total across the workspace) | Done |
| Playwright Electron e2e smoke test (`e2e/desktop.spec.ts`) | Written **and actually run** in the authoring sandbox — passed (no Docker needed, pure SQLite/Electron) |
| First-run local SQLite bootstrap (`prisma db push`) | Verified end-to-end in the authoring sandbox — produced a real file with all 6 expected tables |
| CI wiring (`.github/workflows/ci.yml` — Electron launch smoke test under `xvfb-run`, after the Build step) | Done |
| `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace | Done |
| Every new/edited file under ~300 lines | Done (largest: `auth-session.ts`, 139 lines) |
| Memory-bank documentation sweep | Done |

## Phase 9 — Mobile

| Deliverable | Status |
|---|---|
| `adr/0008` — a ported `expo-sqlite` storage engine chosen over Prisma-in-React-Native (technically impossible — no Android/iOS query-engine binary target) or `nodejs-mobile-react-native` (still no Prisma mobile target, more fragile) | Done |
| New `apps/mobile` (`@pee/mobile`) Expo/React Native app: `package.json`, `app.json`, `eas.json`, `babel.config.js`/`metro.config.js`, NativeWind Tailwind config mirroring `apps/web`'s | Done |
| `db/`: `schema.ts` (SQL mirroring `packages/local-client/prisma/schema.prisma`), `connection.ts` (expo-sqlite bootstrap), `mobile-store.ts` facade + `projects-repo.ts`/`goals-repo.ts`/`tasks-repo.ts`/`outbox-repo.ts` (same public surface as `LocalStore`), `mobile-sync-client.ts` (ported `SyncClient` algorithm) | Done |
| `auth/mobile-auth-session.ts` (mirrors `apps/desktop`'s `AuthSession`; `expo-secure-store` token custody) + `auth-context.tsx` | Done |
| `api/remote-client.ts` (execution/AI/analytics online-only passthroughs), `sync/background-sync.ts` + `sync-context.tsx` (manual + 30s background sync) | Done |
| Renderer (`navigation/`, `screens/`, `components/`): Login, Projects, GoalDetail (+ AI suggestions panel), Analytics, SyncStatusBadge — React Native + NativeWind | Done |
| Unit tests (17 in `@pee/mobile` — `MobileStore`/`MobileSyncClient` against a real embedded SQLite via `node:sqlite`, `MobileAuthSession`, `LoginScreen` — 256 total across the workspace) | Done |
| Detox e2e spec + config (`e2e/mobile.e2e.ts`, `.detoxrc.js`) | Written, not run — no Android emulator/iOS Simulator available in this sandbox; honestly documented, unlike Phase 8's Electron e2e which did run |
| CI wiring (`.github/workflows/ci.yml` — "Mobile app unit tests" step; no Detox CI step, since it can't run here) | Done |
| `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace | Done |
| Every new/edited file under ~300 lines | Done (largest: `screens/GoalDetailScreen.tsx`, 138 lines) |
| Memory-bank documentation sweep | Done |

## Phase 10 — Enterprise

| Deliverable | Status |
|---|---|
| `adr/0009` — Organization/Membership/role model, request-scoped (not session-scoped) org resolution, 404-vs-403 refinement, OIDC-native-vs-SAML-bridged architecture split, and the `@pee/auth` ⇄ `@pee/organizations` circular-package-dependency fix | Done |
| `Organization`/`Membership`/`SsoIdentity` models + `organizationId` on `Project`/`Goal`/`Task`; `User.passwordHash` made nullable (SSO-only users) | Done |
| New `services/organizations` (`@pee/organizations`) — `OrganizationsService`/`MembershipManagementService`, `OrganizationRolesGuard`+`@RequireRole()`, `/organizations` + `/organizations/:id/members` REST endpoints | Done |
| `ProjectsService`/`GoalsService`/`TasksService` retrofit — `findAccessibleOrThrow` (membership-based), org-scoped `create`, `assertDestructivePermission` on `archive` | Done |
| `services/execution`/`services/ai`/`services/sync` — zero code changes; verified they delegate through the retrofitted domain services | Done |
| SSO: OIDC via Auth.js's native provider + `POST /auth/sso/oidc/provision`; SAML via a real SP (`@node-saml/node-saml`) behind an OAuth2 façade (`saml/`); shared `SsoProvisioningService`; `GET /auth/sso/status` | Done |
| `apps/web` — `dashboard/layout.tsx` (first shared shell + org switcher), `/dashboard/organizations` + `/dashboard/organizations/[id]/members`, org selector on the project form, conditional SSO login buttons | Done |
| Unit tests (51 in `@pee/auth`, 27 in `@pee/organizations`, plus extended RBAC cases in `@pee/projects`/`@pee/planning`, plus 8 new `apps/web` Vitest tests — 319 total across the workspace) | Done |
| Integration/e2e tests (`services/organizations/test/organizations.e2e-spec.ts`, extended `services/projects/test/projects.e2e-spec.ts`, `apps/web/e2e/organizations.spec.ts` — Docker Postgres required) | Written, wired into CI — not run in the authoring sandbox (no Docker there) |
| Security review pass: constant-time secret comparison (`SsoProvisionGuard`), origin-parsed (not prefix-matched) SAML redirect allow-list, both with dedicated regression tests | Done |
| `npm run build`, `npm run typecheck`, `npm run lint` clean across the workspace | Done |
| Every new/edited file under ~300 lines | Done (largest: `goals.service.ts`, 220 lines) |
| Memory-bank documentation sweep | Done |

## Next phase

Phase 0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, and 10 are done — **Phase 10 was the last phase defined in the roadmap.** No further product phase is currently scoped; remaining work lives entirely in [27-backlog.md](27-backlog.md) (generate/apply the first Prisma migration and run every Docker-dependent e2e suite at least once; run `apps/mobile`'s Detox e2e on a real device; a real vendor-credentialed AI smoke test; local SQLite file-at-rest encryption on both native clients; SAML SLO/multi-IdP/client-credential validation; org-visibility for execution/AI/analytics; email-token-based invites) — see [20-known-issues.md](20-known-issues.md).

Detail: [18-current-state.md](18-current-state.md), [19-active-work.md](19-active-work.md), [29-next-task.md](29-next-task.md).
