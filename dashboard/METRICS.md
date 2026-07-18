# Metrics

## Product analytics (Phase 7 — live)

Product code now exists across Phases 1–6 (Auth, Projects, Planning, Execution, Sync, AI), and this phase adds a dedicated read layer over that data: `@pee/analytics` (`services/analytics`), rendered at `/dashboard/analytics`. Every metric below is computed live per-user from existing tables (no new domain model was added — only one supporting index on `ExecutionEvent`), so this file describes the metrics contract rather than a frozen snapshot; actual values differ per user and change as they use the product.

- **`GET /analytics/summary`** — counts of Projects/Goals/Tasks by status, total time tracked across all completed `TaskExecutionSession`s, and AI-recommendation adoption (`byStatus` + an acceptance rate computed as `accepted / (accepted + dismissed)`, `null` until anything has been responded to).
- **`GET /analytics/velocity?days=1-90`** — task- and goal-completion counts bucketed per day over the requested trailing window (default 30 days), sourced from the `ExecutionEvent` log (`TASK_COMPLETED` and `GOAL_STATUS_CHANGED → COMPLETED`).
- **`GET /analytics/time-tracking?groupBy=goal|project&sinceDays=1-365`** — total tracked seconds summed per goal (default) or per project, over the requested trailing window (default 90 days).

All three are owner-scoped from the JWT (never a request parameter), bounded by an explicit date-range cap so no query ever scans a user's full history unbounded, and backed by 25 passing unit/DTO tests plus an owner-isolation e2e spec (`services/analytics/test/analytics.e2e-spec.ts`).

## Engineering metrics

**Status: partially instrumented.** No APM/observability backend is wired up yet (tracked in `20-known-issues.md`), so the frontend/backend performance targets below remain aspirational, not measured. What *is* measured, from this repository's own CI/test tooling:

- **208 unit/component tests passing** across all workspaces (`npm run test` at the repo root): 198 backend (Jest, across `@pee/auth`, `@pee/projects`, `@pee/planning`, `@pee/execution`, `@pee/sync`, `@pee/ai`, `@pee/analytics`, `@pee/local-client`, `@pee/api`) + 10 frontend (Vitest, `apps/web`).
- **Build/typecheck/lint clean** across all 12 workspaces as of Phase 7.
- Docker-dependent e2e suites (one per backend service) are written and CI-wired but not executed in this authoring sandbox — see `20-known-issues.md`.

## Targets to track against, once real APM exists

Frontend: initial load < 2s, interaction latency < 100ms, navigation latency < 150ms (`project-memory-bank/25-performance-goals.md`). Backend: TBD — no APM/tracing tool has been selected yet.
