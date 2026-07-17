# 29 — Next Task

**Priority 5 load** — read every session (`claude/STARTUP.md`).

## Immediate next task

None active — Phase 0.5 (Architecture ADRs) is complete. Waiting on user direction to begin Phase 1 (Authentication).

## Recommended next step

Scope **Phase 1 — Authentication**: write its feature spec/PRD entry ([02-prd.md](02-prd.md)), then implement against the now-resolved stack — NestJS `auth` module (system of record for users/credentials), Auth.js on the Next.js frontend, JWT + refresh-token sessions — per [adr/0005](../adr/0005-authentication-strategy.md). No further architecture decisions block this; use `/implement-feature` or `/backend-workflow`.

Full roadmap: [16-roadmap.md](16-roadmap.md). Current status: [17-phase-status.md](17-phase-status.md).
