# 02 — Product Requirements Document

**Status: Phase 1 (Authentication) written and implemented, 2026-07-17.**

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

## What belongs here once written

For each defined feature/epic, per `SYSTEM_PROMPT.md` §72-73 (`System_Prompt/Part5.md`):

- Objective, current state, desired state
- Required APIs, database impact, UI impact, AI impact
- Testing strategy, migration requirements, observability impact, security considerations
- Documentation updates required
- Business value, success metrics, risks, estimated implementation order

## Process

A PRD entry is written during Epic Planning (§72) — before implementation begins, never retroactively. Use [templates/epic-template.md](../templates/README.md) and [templates/feature-spec-template.md](../templates/README.md) once available (Group 6).
