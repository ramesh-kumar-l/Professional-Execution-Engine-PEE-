# 20 — Known Issues / Risk Register

Source of truth for process: `SYSTEM_PROMPT.md` §82 (`System_Prompt/Part5.md`).

## Open risks

| Risk | Type | Impact | Mitigation |
|---|---|---|---|
| Local SQLite ↔ Postgres sync protocol not yet designed | Technical | Blocks real offline behavior (Local-First, Principle 2) | Design when first feature needs it (Memory Engine, Phase 5, or earlier); schema already sync-ready per `adr/0003` (UUID PKs, `updated_at`/version columns) |
| SYSTEM_PROMPT.md's example repo layout (§36) and memory-bank file list (§17) are illustrative, not exhaustive | Architectural | Could cause drift if followed too literally once real structure is chosen | Treat as example; record actual structure decisions as ADRs, update [03-system-architecture.md](03-system-architecture.md) |
| `npm audit` (2026-07-17) reports transitive advisories in the NestJS 10.x/Express chain and Next.js 14.x that only clear via a major-version bump (Nest 11, Next 16) | Dependency | Known CVEs (DoS-class, one critical) remain until upgraded | Deliberately deferred rather than force-upgrading mid-feature (`npm audit fix --force` would pull in untested majors); revisit as a dedicated upgrade task, re-run full test suite before merging |
| Auth module's integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`) and the frontend Playwright spec (`apps/web/e2e/login.spec.ts`) require a real Postgres (Docker) and were not executed in the authoring sandbox (no Docker available there) | Testing | Full register→login→refresh→logout flow is untested against a live database until first run | Written to spec and wired into `.github/workflows/ci.yml`, which does have Postgres; run locally via `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d` then `npm run test:e2e -w @pee/auth` / `-w web` before trusting them fully |

Product-code risks begin with Phase 1 (Authentication), implemented 2026-07-17. Add entries here as soon as new issues are discovered; never leave a known risk undocumented.
