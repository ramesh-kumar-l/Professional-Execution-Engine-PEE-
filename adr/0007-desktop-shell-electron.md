# ADR-0007: Desktop Shell — Electron

- **Status:** Accepted
- **Date:** 2026-07-18
- **Phase:** 8 (Desktop)

## Problem

Phase 5 built `packages/local-client` (`@pee/local-client`) — a `LocalStore`/`SyncClient` pair implementing the sync protocol against `services/sync` — explicitly so Phase 8 (Desktop) and Phase 9 (Mobile) could build on it "rather than re-invent" (`08-backend-guidelines.md`). Phase 8's exit criteria are literal: reuse the same API, the same design conventions, and `@pee/local-client`, with no rewrite. No prior ADR commits to a desktop shell technology — ADR-0002/0003 anticipated "web/desktop/mobile" clients but deferred the choice to this phase.

## Context

- `@pee/local-client` is a plain Node/Prisma library: `LocalStore` wraps a `PrismaClient` against a SQLite file; `SyncClient` talks to `services/sync` over `fetch`. Nothing about it is browser-specific or platform-specific — it just needs a Node.js runtime.
- `apps/web` has no shared design-system *package* to reuse (`design-system/tokens.md` is still TBD) — only a plain Tailwind baseline and consistent utility-class conventions across its pages.
- No Electron or Tauri tooling exists anywhere in the repo yet.

## Options Considered

1. **Electron**, with the local SQLite/sync logic running unmodified inside the main process (a Node.js context).
2. **Tauri**, with a Rust backend and a webview frontend.
3. **A thin native wrapper per platform** (e.g., separate Swift/C++/C# shells) embedding a webview pointed at `apps/web`.

## Decision

**Option 1 — Electron.** Electron's main process is Node.js, so `@pee/local-client`'s `LocalStore`/`SyncClient` can be imported and run exactly as built in Phase 5 — zero modification. Tauri's backend is Rust; using it would require re-implementing the local-store/sync logic in Rust, which is precisely the rewrite this phase's exit criteria forbid. Per-platform native wrappers (Option 3) would mean re-hosting `apps/web`'s server-rendered Next.js pages inside a webview, which doesn't fit an offline-first desktop shell that needs to read/write local SQLite via IPC in the first place, and offers no path to reusing `@pee/local-client` at all.

The renderer is a new React + Vite UI (`apps/desktop/src`) rather than a literal reuse of `apps/web`'s Server Components — Next.js's server-rendering model is architecturally incompatible with an offline-capable client that needs synchronous local reads. "No rewrite" is satisfied at the level the exit criteria actually constrain: the backend API contract (`services/api`, untouched) and `@pee/local-client` (imported unmodified) — not the presentation layer, which necessarily differs between a server-rendered web client and an offline-first desktop client. The renderer reuses `apps/web`'s Tailwind baseline and utility-class conventions (`apps/desktop/tailwind.config.ts` mirrors `apps/web/tailwind.config.ts`) to keep the same visual language.

## Trade-offs

Gained: `@pee/local-client` ships as its intended consumer with no adaptation; the same `services/auth`/`services/execution`/`services/ai`/`services/analytics` REST contracts `apps/web` already calls are reused unmodified for the surfaces outside `@pee/local-client`'s sync registry (execution sessions, AI suggestions, analytics). Given up: Electron's larger runtime footprint versus Tauri, and Prisma's query-engine binary needs explicit `asarUnpack` packaging handling — both accepted as the cost of the "no rewrite" constraint, not overlooked.

## Migration Impact

None — this is a new app (`apps/desktop`), not a change to any existing service or package. `@pee/local-client`'s public API (`LocalStore`, `SyncClient`) is unchanged.

## Alternatives Rejected

Option 2 (Tauri) rejected: its Rust backend cannot run `@pee/local-client` without reimplementing it, directly violating "no rewrite." Option 3 (native wrappers around `apps/web`) rejected: no offline capability, no path to consuming `@pee/local-client`, and N platform-specific codebases instead of one.

## Memory Bank Reference

`08-backend-guidelines.md`, `project-memory-bank/02-prd.md` (Phase 8 entry), `adr/0002-backend-language-and-service-boundaries.md`, `adr/0003-database-and-local-first-storage.md`.
