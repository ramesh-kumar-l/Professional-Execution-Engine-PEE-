# 29 — Next Task

**Priority 5 load** — read every session (`claude/STARTUP.md`).

## Immediate next task

None active — Phase 1 (Authentication), Phase 2 (Projects), Phase 3 (Planning Engine), Phase 4 (Execution Engine), and Phase 5 (Memory Engine) are complete. Waiting on user direction to begin Phase 6 (AI Integration).

## Recommended next step

Before scoping Phase 6, ideally in an environment with Docker: run `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`, then `npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma` (this generates the **first-ever** migration — none exists yet, for any phase's tables), then `npm run test:e2e -w @pee/auth`, `-w @pee/projects`, `-w @pee/planning`, `-w @pee/execution`, `-w @pee/sync`, `-w @pee/local-client`, and `-w web` — all written and wired into CI but never executed in the authoring sandbox (no Docker there).

Then scope **Phase 6 — AI Integration**: write its feature spec/PRD entry ([02-prd.md](02-prd.md)) against the Phase 1 (auth) + Phase 2 (projects) + Phase 3 (planning) + Phase 4 (execution) + Phase 5 (sync) foundation, building on the `AIProvider` abstraction resolved in `adr/0006`, following the same `services/<name>` module pattern as `auth`/`projects`/`planning`/`execution`/`sync`. Use `/implement-feature` or `/backend-workflow`.

Full roadmap: [16-roadmap.md](16-roadmap.md). Current status: [17-phase-status.md](17-phase-status.md).
