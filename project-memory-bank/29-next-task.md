# 29 — Next Task

**Priority 5 load** — read every session (`claude/STARTUP.md`).

## Immediate next task

None active — Phase 1 (Authentication), Phase 2 (Projects), Phase 3 (Planning Engine), Phase 4 (Execution Engine), Phase 5 (Memory Engine), Phase 6 (AI Integration), Phase 7 (Analytics), Phase 8 (Desktop), and Phase 9 (Mobile) are complete. Waiting on user direction to begin Phase 10 (Enterprise).

## Recommended next step

Before scoping Phase 10, ideally in an environment with Docker and a mobile device/emulator: run `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`, then `npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma` (this generates the **first-ever** migration — none exists yet, for any phase's tables), then `npm run test:e2e -w @pee/auth`, `-w @pee/projects`, `-w @pee/planning`, `-w @pee/execution`, `-w @pee/sync`, `-w @pee/local-client`, `-w @pee/ai`, `-w @pee/analytics`, and `-w web` — all written and wired into CI but never executed in the authoring sandbox (no Docker there; `apps/desktop`'s e2e is the one exception — it needs no Postgres and was already run successfully). Separately, run `apps/mobile`'s Detox e2e spec (`apps/mobile/e2e/mobile.e2e.ts`) on a real Android emulator or iOS Simulator — also written and CI-wired but never executed here (no emulator/Simulator available). Separately, run a real vendor-credentialed smoke test of `services/ai` (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`) before relying on it in production. Separately, revisit local SQLite file-at-rest encryption (`27-backlog.md`) before `apps/desktop` or `apps/mobile` reaches real users.

Then scope **Phase 10 — Enterprise** against the Phase 1-9 foundation. Use `/implement-feature` or `/backend-workflow`.

Full roadmap: [16-roadmap.md](16-roadmap.md). Current status: [17-phase-status.md](17-phase-status.md).
