# ADR-0008: Mobile Local Storage — Ported SQLite Store (Expo/expo-sqlite), Not Prisma

- **Status:** Accepted
- **Date:** 2026-07-18
- **Phase:** 9 (Mobile)

## Problem

Phase 8's exit criteria for Desktop were literal: reuse `@pee/local-client`, no rewrite — satisfied because Electron's main process is a real Node.js runtime. Phase 9's exit criteria anticipate this might not carry over as cleanly, phrasing it as "a mobile shell whose runtime can host `@pee/local-client` **(or an equivalent)** without a rewrite." This ADR records why the literal path is not available on mobile, and what "equivalent" means concretely.

## Context

- `@pee/local-client`'s `LocalStore` wraps a generated Prisma Client against a SQLite file. Prisma's query engine is a **native binary compiled per OS/arch target** (Windows/macOS/Linux x64/arm64) — Prisma publishes no Android or iOS binary target. There is no supported way to load this binary inside a mobile app.
- `SyncClient` is not decoupled from that either: `buildPushChange` reaches directly into `this.store.db.localProject.findUnique(...)`, coupling it to `LocalStore`'s Prisma shape, not just its documented method surface.
- React Native's JS runtime (Hermes/JSC) is not Node.js — no `fs`, no native binary spawning, no path to run `npx prisma db push` the way `apps/desktop/electron/main/store/local-store-factory.ts` does.
- Everything else in the sync protocol *is* portable: `@pee/types`'s `SyncChangeRecord`/`SyncPushChange`/`SyncPullResponse`/`SyncPushResponse` are plain data shapes, and the `POST /sync/pull`/`POST /sync/push` contract on `services/sync` has no client-runtime assumptions baked in.

## Options Considered

1. **Port the storage engine to `expo-sqlite`, keep everything else (protocol logic, shared types, REST contracts) unmodified or literally ported.**
2. **`nodejs-mobile-react-native`**, embedding a real Node.js runtime in the app so `@pee/local-client` could theoretically run unmodified.
3. **Capacitor**, wrapping `apps/web`'s pages in a native shell with a community SQLite plugin.

## Decision

**Option 1.** A new `MobileStore` (in `apps/mobile/src/db/`) is backed by `expo-sqlite`'s async API, with hand-written SQL table definitions mirroring `packages/local-client/prisma/schema.prisma` field-for-field, and a public method surface matching `LocalStore`'s one-for-one. A new `MobileSyncClient` is a line-for-line port of `packages/local-client/src/sync-client.ts`'s `pull`/`push`/`groupByRecord`/`buildPushChange` logic — same cursor bookkeeping, same outbox-collapsing, same last-write-wins conflict handling — reading through `MobileStore`'s repos instead of Prisma. `@pee/types` and the `services/sync` REST contract are consumed completely unmodified; zero backend changes.

Option 2 (`nodejs-mobile-react-native`) was rejected: even with a real Node runtime embedded, Prisma's query engine still has no published Android/iOS binary target, so `@pee/local-client` would still not run without a custom, unsupported engine build — trading one rewrite for a more fragile one, while adding a large, exotic dependency for a single feature. Option 3 (Capacitor) was rejected for the same reason Tauri/native-wrapper approaches were rejected for Desktop (`adr/0007`): wrapping `apps/web`'s server-rendered pages in a webview has no path to local, synchronous reads, and Capacitor's SQLite story is a community plugin rather than an officially maintained one.

## Trade-offs

Gained: a mobile client that is genuinely offline-capable for Project/Goal/Task, talking to the exact same backend `apps/web`/`apps/desktop` already use, with the tricky part of the protocol (conflict resolution, cursor management, outbox collapsing) preserved by direct port rather than reinvented from scratch. Given up: `@pee/local-client` itself is not imported — its logic is duplicated (deliberately, as a faithful port) rather than shared via a common package, since the two runtimes cannot share a storage-engine-coupled class. A future refactor could extract the pull/push *algorithm* (independent of storage engine) into a shared package if a third consumer ever needs it; not attempted now, since two consumers doesn't yet justify the abstraction (Sustainable Complexity, Principle 8).

## Migration Impact

None — this is a new app (`apps/mobile`), not a change to any existing service or package. `@pee/local-client`'s public API is unchanged; `services/sync`'s REST contract is unchanged.

## Alternatives Rejected

See Options 2 and 3 above.

## Memory Bank Reference

`08-backend-guidelines.md`, `project-memory-bank/02-prd.md` (Phase 9 entry), `adr/0003-database-and-local-first-storage.md`, `adr/0007-desktop-shell-electron.md`.
