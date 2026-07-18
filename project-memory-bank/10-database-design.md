# 10 — Database Design

Source of truth for principles: `SYSTEM_PROMPT.md` §39 (`System_Prompt/Part3.md`). Concrete database technology: PostgreSQL (server) + SQLite (local client store) + Prisma ORM — see [04-technology-stack.md](04-technology-stack.md) and [adr/0003](../adr/0003-database-and-local-first-storage.md).

## Binding conventions (from adr/0003, apply to every table from Phase 1 onward)

- Primary keys are client-generated UUIDs, not auto-increment integers.
- Every syncable table has an `updated_at` column and a version/revision column.

These exist so offline sync (Local-First, Principle 2) can be added later without a schema migration that touches every existing row.

## Governing principles (apply regardless of which database is chosen)

- The database is a source of truth — never optimize prematurely.
- Explicit schema.
- Versioned migrations — every schema change requires one.
- Foreign-key integrity.
- Transaction safety.
- Soft deletes where appropriate.
- Audit history.
- Optimistic locking where required.
- Documented indexes.

## Status

**Phase 5 schema implemented, 2026-07-18** (`packages/database/prisma/schema.prisma` + `packages/local-client/prisma/schema.prisma`).

## Current tables

- **`User`** (`users`) — `id` (uuid), `email` (unique), `passwordHash` (argon2), `displayName`, `role` (enum, `USER` default), `createdAt`, `updatedAt`, `version`.
- **`RefreshToken`** (`refresh_tokens`) — `id` (uuid), `userId` (FK, cascade delete), `tokenHash` (unique, SHA-256 of the opaque raw token — the raw value is never stored), `issuedAt`, `expiresAt`, `revokedAt` (nullable), `replacedByTokenId` (nullable self-relation, rotation chain), `updatedAt`, `version`.
- **`AuthAuditLog`** (`auth_audit_logs`) — `id` (uuid), `userId` (nullable FK, set-null on delete), `eventType` (enum: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `TOKEN_REUSE_DETECTED`), `ipAddress`, `userAgent`, `createdAt`, `updatedAt`, `version`.
- **`Project`** (`projects`) — `id` (uuid), `ownerId` (FK to `User`, cascade delete), `name`, `description` (nullable), `status` (enum `ProjectStatus`: `ACTIVE`/`ARCHIVED`, default `ACTIVE`), `archivedAt` (nullable, set when archived), `createdAt`, `updatedAt`, `version`. Indexed on `ownerId`. `DELETE /projects/:id` sets `status = ARCHIVED` + `archivedAt` rather than removing the row (soft delete).
- **`Goal`** (`goals`) — `id` (uuid), `projectId` (FK to `Project`, cascade delete), `ownerId` (FK to `User`, cascade delete), `title`, `description` (nullable), `status` (enum `GoalStatus`: `NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`/`ARCHIVED`, default `NOT_STARTED`), `targetDate` (nullable), `completedAt` (nullable, set when status becomes `COMPLETED`), `createdAt`, `updatedAt`, `version`. Indexed on `projectId` and `ownerId`. `status`/`completedAt` are driven automatically by `GoalsService.recalculateProgress` based on child `Task` completion (see [08-backend-guidelines.md](08-backend-guidelines.md)) as well as settable manually via `PATCH`.
- **`Task`** (`tasks`) — `id` (uuid), `goalId` (FK to `Goal`, cascade delete), `ownerId` (FK to `User`, cascade delete), `title`, `description` (nullable), `status` (enum `TaskStatus`: `TODO`/`IN_PROGRESS`/`DONE`/`ARCHIVED`, default `TODO`), `order` (int, default 0, decomposition ordering within a goal), `completedAt` (nullable, set when status becomes `DONE`), `createdAt`, `updatedAt`, `version`. Indexed on `goalId` and `ownerId`. `DELETE /tasks/:id` sets `status = ARCHIVED` (soft delete).
- **`TaskExecutionSession`** (`task_execution_sessions`) — `id` (uuid), `taskId` (FK to `Task`, cascade delete), `ownerId` (FK to `User`, cascade delete), `startedAt`, `endedAt` (nullable — null means the session is still open/running), `durationSeconds` (nullable, computed on complete), `createdAt`, `updatedAt`, `version`. Indexed on `taskId` and `ownerId`. At most one open session (`endedAt IS NULL`) per task, enforced in `TaskSessionsService`, not a DB constraint.
- **`ExecutionEvent`** (`execution_events`) — `id` (uuid), `ownerId` (FK to `User`, cascade delete), `goalId`/`taskId` (both nullable FKs, cascade delete), `eventType` (enum `ExecutionEventType`: `TASK_STARTED`/`TASK_STATUS_CHANGED`/`TASK_COMPLETED`/`TASK_ARCHIVED`/`GOAL_STATUS_CHANGED`), `fromStatus`/`toStatus` (nullable strings), `createdAt`. Indexed on `ownerId`, `goalId`, `taskId`. **Append-only — deliberately has no `updatedAt`/`version`**, unlike every other table: a log row is never mutated after insert, so the `adr/0003` sync-merge columns (meant for mutable rows) would be meaningless here.

All tables except `ExecutionEvent` follow the `adr/0003` binding conventions (UUID PKs, `updatedAt`/`version`). `Goal`/`Task` denormalize `ownerId` directly (rather than only reachable via a join through `Project`/`Goal`) so ownership checks stay O(1), matching `Project`'s existing pattern.

**Phase 5 additions:** `Project`/`Goal`/`Task` each gained a composite `@@index([ownerId, updatedAt])` — the sync-pull query pattern (`WHERE ownerId = ? AND updatedAt > ?`) isn't covered by the existing single-column `ownerId` index alone. No new Postgres tables; `version` (present on these tables since Phase 1 per `adr/0003`, but never incremented by any service until now) is finally wired up as a live optimistic-concurrency guard — see [08-backend-guidelines.md](08-backend-guidelines.md).

## Local client schema (`packages/local-client/prisma/schema.prisma`)

A **separate** SQLite datasource — not the same Prisma client as `@pee/database` — generated to the gitignored `prisma/generated/client` so it never collides with the Postgres client in the hoisted workspace `node_modules`. Mirrors the syncable subset of the server schema:

- **`LocalProject`/`LocalGoal`/`LocalTask`** — same fields as their Postgres counterparts (status/eventType stored as plain `String`, since SQLite has no native enum type). `id` is always application-supplied (`crypto.randomUUID()`), never DB-generated, so a row created offline keeps the same primary key once pushed to Postgres.
- **`LocalExecutionEvent`** — a local cache shape exists in the schema for future use, but nothing currently populates it; `ExecutionEvent` is out of the sync protocol for Phase 5 (see [27-backlog.md](27-backlog.md)).
- **`SyncCursor`** — one row per pull cursor (currently a single combined cursor covering all three entities).
- **`SyncOutboxEntry`** — the local-first "outbox": every local write is recorded here until a push confirms it landed on the server. `LocalStore` collapses repeat edits to the same record into one pushed change.

This schema/client pairing is what `packages/local-client` uses to prove the sync protocol against a real embedded database, not a mock — see `sync-roundtrip.e2e-spec.ts`.

**No migration files exist yet** (`packages/database/prisma/migrations/` has never been generated) — `prisma migrate dev` requires a live database to diff against, and no Docker/Postgres has been available in the authoring sandbox for Phases 1-5. Once Docker is available: `npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma` (creates the first migration, covering every table at once), then `prisma migrate deploy` for CI/prod (see `.github/workflows/ci.yml`, which currently has nothing to deploy until this migration exists). Tracked in [20-known-issues.md](20-known-issues.md). This gap doesn't apply to `packages/local-client`'s SQLite schema — a single local file has no prior deployments to reconcile, so it's provisioned with `prisma db push` (schema-sync, no migration history needed) each time a fresh local store is created; see `packages/local-client/test/test-db.ts` for the pattern its tests use.
