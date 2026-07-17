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

## Product code now exists — Phase 1 (Authentication), 2026-07-17

- **`package.json`, `tsconfig.base.json`** at root — npm workspaces (`packages/*`, `services/*`, `apps/*`).
- **`packages/database`** (`@pee/database`) — Prisma schema (`User`, `RefreshToken`, `AuthAuditLog`), `PrismaService`/`PrismaModule`.
- **`packages/types`** (`@pee/types`) — shared auth DTOs (`RegisterRequest`, `LoginRequest`, `AuthTokens`, `UserProfile`).
- **`services/auth`** (`@pee/auth`) — `AuthModule`/`AuthController`/`AuthService`, `TokenService` (JWT access + opaque hashed refresh), `PasswordService` (argon2), `AuditLogService`, `JwtStrategy`/`JwtAuthGuard`. Tests: 4 unit spec files (24 tests), 1 e2e spec (register→login→refresh→logout flow, requires Docker Postgres).
- **`services/api`** (`@pee/api`) — composition root (`main.ts`, `app.module.ts`, `HealthController`). Test: 1 unit spec.
- **`apps/web`** (`web`) — Next.js 14 App Router + Auth.js v5: `/login`, `/register`, `/dashboard`, `middleware.ts` route protection, `auth.ts` (Credentials provider + refresh-on-expiry `jwt` callback), server-only `lib/api-client.ts`. Tests: Vitest+RTL unit (2 tests), Playwright e2e (register→login→dashboard→logout, requires the full stack running).
- **`infrastructure/docker/docker-compose.dev.yml`** — Postgres (dev + test) for local use.
- **`.github/workflows/ci.yml`** — install, Prisma generate/migrate, lint, typecheck, unit tests, auth e2e, build, then boots the API + web app and runs the Playwright suite against them.

Verified in the authoring environment (no Docker available there): `npm install`, `npm run build`, `npm run typecheck`, `npm run lint -w web`, and all 26 unit tests pass across `@pee/auth`, `@pee/api`, and `web`. Integration/e2e specs requiring a live Postgres are written and wired into CI but were **not executed** in this sandbox — see [20-known-issues.md](20-known-issues.md).

## What does not exist yet

- Projects/Planning/Execution/Memory/Analytics/AI-integration/Desktop/Mobile/Enterprise product code (Phases 2-10).
- OAuth social login, email verification, password reset — explicitly deferred, see [27-backlog.md](27-backlog.md).
- Concrete design-system token values (categories/rules only) — Phase 1 UI is deliberately minimal, not a full design-system build-out.
- The local SQLite ↔ Postgres sync protocol (deferred per `adr/0003` to whichever phase first needs real offline behavior).

## Architecture

**Resolved 2026-07-17 (`adr/0002`-`adr/0006`); Phase 1 (Authentication) implemented against it, same day.** Backend: TypeScript/NestJS modular monolith. Storage: PostgreSQL (implemented) + SQLite local (not yet needed). Infra: Docker/docker-compose (implemented for dev/CI), GitHub Actions (implemented), K8s/Terraform deferred. Auth: first-party NestJS module + Auth.js, JWT sessions — implemented. AI: first-party provider interface, Claude + OpenAI — not yet implemented (Phase 6). Full detail and rationale: [03-system-architecture.md](03-system-architecture.md) and `adr/0002`-`adr/0006`.
