# 29 — Next Task

**Priority 5 load** — read every session (`claude/STARTUP.md`).

## Immediate next task

None active — Phase 1 (Authentication) is complete. Waiting on user direction to begin Phase 2 (Projects).

## Recommended next step

Before scoping Phase 2: run the Docker-dependent integration/e2e suite at least once (`docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`, then `npx prisma migrate dev --schema packages/database/prisma/schema.prisma`, then `npm run test:e2e -w @pee/auth` and `-w web`) — these were written and wired into CI but not executed in the authoring sandbox (no Docker there).

Then scope **Phase 2 — Projects**: write its feature spec/PRD entry ([02-prd.md](02-prd.md)) against the Phase 1 auth foundation (`services/auth`, `@pee/types`), following the same `services/<name>` module pattern as `auth`. Use `/implement-feature` or `/backend-workflow`.

Full roadmap: [16-roadmap.md](16-roadmap.md). Current status: [17-phase-status.md](17-phase-status.md).
