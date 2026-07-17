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

**Phase 1 schema implemented, 2026-07-17** (`packages/database/prisma/schema.prisma`).

## Current tables

- **`User`** (`users`) — `id` (uuid), `email` (unique), `passwordHash` (argon2), `displayName`, `role` (enum, `USER` default), `createdAt`, `updatedAt`, `version`.
- **`RefreshToken`** (`refresh_tokens`) — `id` (uuid), `userId` (FK, cascade delete), `tokenHash` (unique, SHA-256 of the opaque raw token — the raw value is never stored), `issuedAt`, `expiresAt`, `revokedAt` (nullable), `replacedByTokenId` (nullable self-relation, rotation chain), `updatedAt`, `version`.
- **`AuthAuditLog`** (`auth_audit_logs`) — `id` (uuid), `userId` (nullable FK, set-null on delete), `eventType` (enum: `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `TOKEN_REFRESH`, `TOKEN_REUSE_DETECTED`), `ipAddress`, `userAgent`, `createdAt`, `updatedAt`, `version`.

All three follow the `adr/0003` binding conventions (UUID PKs, `updatedAt`/`version`). Migrations: `npx prisma migrate dev --schema packages/database/prisma/schema.prisma` (dev), `prisma migrate deploy` (CI/prod, see `.github/workflows/ci.yml`).
