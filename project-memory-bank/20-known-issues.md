# 20 — Known Issues / Risk Register

Source of truth for process: `SYSTEM_PROMPT.md` §82 (`System_Prompt/Part5.md`).

## Open risks

| Risk | Type | Impact | Mitigation |
|---|---|---|---|
| Local SQLite ↔ Postgres sync protocol not yet designed | Technical | Blocks real offline behavior (Local-First, Principle 2) | Design when first feature needs it (Memory Engine, Phase 5, or earlier); schema already sync-ready per `adr/0003` (UUID PKs, `updated_at`/version columns) |
| SYSTEM_PROMPT.md's example repo layout (§36) and memory-bank file list (§17) are illustrative, not exhaustive | Architectural | Could cause drift if followed too literally once real structure is chosen | Treat as example; record actual structure decisions as ADRs, update [03-system-architecture.md](03-system-architecture.md) |
| `npm audit` (2026-07-17) reports transitive advisories in the NestJS 10.x/Express chain and Next.js 14.x that only clear via a major-version bump (Nest 11, Next 16) | Dependency | Known CVEs (DoS-class, one critical) remain until upgraded | Deliberately deferred rather than force-upgrading mid-feature (`npm audit fix --force` would pull in untested majors); revisit as a dedicated upgrade task, re-run full test suite before merging |
| Auth module's integration/e2e tests (`services/auth/test/auth.e2e-spec.ts`), the projects module's (`services/projects/test/projects.e2e-spec.ts`), and the frontend Playwright specs (`apps/web/e2e/login.spec.ts`, `apps/web/e2e/projects.spec.ts`) require a real Postgres (Docker) and were not executed in the authoring sandbox (no Docker available there) | Testing | Full flows are untested against a live database/browser until first run | Written to spec and wired into `.github/workflows/ci.yml`, which does have Postgres; run locally via `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d` then `npm run test:e2e -w @pee/auth` / `-w @pee/projects` / `-w web` before trusting them fully |
| No Prisma migration file has ever been generated (`packages/database/prisma/migrations/` doesn't exist) | Technical | `prisma migrate deploy` (used in CI and for prod) has nothing to apply — the database schema (including `Project`, added this phase) has never actually been created against a real Postgres | `prisma migrate dev` needs a live database to diff against; run `npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma` once Docker/Postgres is available, commit the generated migration, then re-verify `migrate deploy` in CI |
| Project CRUD actions are not audit-logged | Security/Observability | No record of who created/edited/archived a project, unlike auth events | `AuthAuditLog` is auth-specific; a general domain-entity audit trail is deferred until a real need (compliance, support debugging) identifies what to capture — see [27-backlog.md](27-backlog.md) |

Product-code risks begin with Phase 1 (Authentication), implemented 2026-07-17; Phase 2 (Projects) added 2026-07-18. Add entries here as soon as new issues are discovered; never leave a known risk undocumented.
