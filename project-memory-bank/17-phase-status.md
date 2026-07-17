# 17 — Phase Status

**Priority 2 load** — read every session (`claude/STARTUP.md`).

## Current phase

**Phase 2 — Projects. Complete (2026-07-18).**

Phase 0 (EOS bootstrap), Phase 0.5 (architecture ADRs), and Phase 1 (Authentication) are complete. Phase 2 — the first domain-entity feature — is implemented: `services/projects` (NestJS module, ownership-scoped CRUD on `Project`), `packages/database` (`Project` table added), `packages/types` (project DTOs added), `apps/web` (project list/create/edit pages). See [02-prd.md](02-prd.md) for the feature spec and acceptance criteria.

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

## Next phase

Phase 0, 0.5, 1, and 2 are done. **Phase 3 — Planning Engine** is next, once scoped (`16-roadmap.md`). Before then: generate and apply the first Prisma migration and run the Docker-dependent e2e suites at least once — see [20-known-issues.md](20-known-issues.md).

Detail: [18-current-state.md](18-current-state.md), [19-active-work.md](19-active-work.md), [29-next-task.md](29-next-task.md).
