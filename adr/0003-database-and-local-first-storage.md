# ADR-0003: Database, ORM, and Local-First Storage Strategy

- **Status:** Accepted
- **Date:** 2026-07-17
- **Phase:** 0.5 (Foundation — Architecture ADR)

## Problem

`10-database-design.md` is entirely TBD. Beyond picking a server database, Principle 2 (Local First, `01-product-principles.md`) requires local storage, local indexing, and offline support with cloud as an enhancement, never a dependency — this is a storage-architecture constraint, not just a technology pick, and it must be decided before any schema is written so later phases don't retrofit sync onto an online-only design.

## Context

- Backend is TypeScript/NestJS, modular monolith (ADR-0002).
- §39 governing principles already pinned regardless of engine: explicit schema, versioned migrations, foreign-key integrity, transaction safety, soft deletes, audit history, documented indexes.
- Must eventually support personal, team, and enterprise multi-tenant usage (§10) without a rewrite.
- No entity/schema design work has started; this ADR fixes technology and storage topology only, not the schema itself (that follows in Phase 1+ per-feature work).

## Options Considered

1. **PostgreSQL (server) + SQLite (embedded local store) + Prisma ORM.** Postgres for the durable multi-tenant source of truth; SQLite as each client's local, offline-capable store; Prisma gives type-safe schema/migrations shared across both via its multi-datasource support and keeps queries type-checked against `/packages/types`.
2. **PostgreSQL only, online-only, add offline support later.** Simpler now; directly violates Principle 2 and risks exactly the rewrite §10 warns against once offline support is demanded.
3. **A dedicated local-first sync engine/CRDT store (e.g., embedded CRDT) as the primary model everywhere, Postgres as just a backup.** Strongest offline guarantees, but far more complexity than justified before a single feature exists — violates Sustainable Complexity (Principle 8).
4. **MongoDB (server) instead of Postgres.** Schema flexibility, but weaker fit for the relational integrity and foreign-key/audit requirements already pinned in §39, and no current data shape demands document flexibility over relational modeling.

## Decision

**Option 1.** PostgreSQL is the server-side source of truth; each client (web/desktop/mobile) maintains a local SQLite store for offline read/write; Prisma is the ORM/migration tool for the Postgres side. The sync protocol reconciling local SQLite writes with Postgres is **not designed in this ADR** — it is scoped to whichever phase first requires real offline behavior (Memory Engine, Phase 5, or earlier if a specific feature demands it), but the storage pairing is fixed now so schema work in Phase 1+ doesn't assume an online-only shape (e.g., every table gets a client-generated UUID primary key and an `updated_at`/version column from the start, so sync remains possible later without a migration rewrite).

## Trade-offs

Gained: relational integrity and audit/versioning support (§39) on the server; a clear, unblocked path to offline support without redesigning primary keys or schema later. Given up: the actual sync engine is deferred — early phases (Auth, Projects) will behave as online-only in practice even though the schema is sync-ready; this is acceptable since no offline requirement exists yet for those phases.

## Migration Impact

None yet — no schema exists. Establishes two binding conventions for all future schema work: (1) client-generated UUIDs (not auto-increment integers) as primary keys, (2) an `updated_at` and version/revision column on every syncable table.

## Alternatives Rejected

Option 2 rejected: online-only now creates exactly the future-rewrite risk §10 exists to prevent. Option 3 rejected: CRDT-first is disproportionate complexity for a system with zero shipped features; revisit only if Postgres+SQLite reconciliation proves insufficient. Option 4 rejected: no current entity has been identified that needs document flexibility over relational structure, and it would forfeit the FK/audit guarantees already required.

## Memory Bank Reference

`project-memory-bank/10-database-design.md`, `03-system-architecture.md`, `04-technology-stack.md`.
