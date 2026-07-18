# 16 — Roadmap

Source of truth: `SYSTEM_PROMPT.md` §22 (`System_Prompt/Part2.md`). Each phase must be independently releasable and deliver measurable value. Work on one phase at a time unless explicitly instructed otherwise.

## Product phases (§22)

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation | Complete — EOS bootstrap + architecture ADRs (0.5) |
| 1 | Authentication | **Complete** — 2026-07-17, `auth` NestJS module + Auth.js frontend |
| 2 | Projects | **Complete** — 2026-07-18, `projects` NestJS module + Next.js CRUD UI |
| 3 | Planning Engine | **Complete** — 2026-07-18, `planning` NestJS module (Goal/Task decomposition, closed-loop progress rollup) + Next.js UI |
| 4 | Execution Engine | **Complete** — 2026-07-18, `execution` NestJS module (task start/complete timer, unconditional status-change event log via `@nestjs/event-emitter`, active-work dashboard) + Next.js UI |
| 5 | Memory Engine | **Complete** — 2026-07-18, `sync` NestJS module (`POST /sync/pull`/`POST /sync/push`, optimistic-lock version guard + last-write-wins conflict resolution) + `packages/local-client` (reusable reference SQLite client) |
| 6 | AI Integration | **Complete** — 2026-07-18, `ai` NestJS module (`AIProvider` interface — Anthropic + OpenAI implementations — plus its first feature: goal → task-breakdown suggestions with human accept/dismiss) |
| 7 | Analytics | **Complete** — 2026-07-18, `analytics` NestJS module (summary/velocity/time-tracking read endpoints over Phases 2-6's data, `dashboard/METRICS.md` now documents the live metrics contract) |
| 8 | Desktop | **Complete** — 2026-07-18, Electron app (`apps/desktop`) consuming `packages/local-client` unmodified |
| 9 | Mobile | **Complete** — 2026-07-18, Expo/React Native app (`apps/mobile`) consuming a ported equivalent of `packages/local-client` |
| 10 | Enterprise | **Complete** — 2026-07-18, `Organization`/`Membership` model + RBAC retrofit of `ProjectsService`/`GoalsService`/`TasksService`, `services/organizations`, OIDC (Auth.js native provider) + SAML (self-built SP behind an OAuth2 façade) SSO |

**Phase 10 was the last phase defined in this roadmap.** No further product phase is currently scoped — remaining work lives in `27-backlog.md`.

## Current sub-phase: Phase 10 implemented

Phase 0's EOS bootstrap and Phase 0.5's architecture ADRs completed 2026-07-16/17. Phase 1 — Authentication — implemented 2026-07-17. Phases 2-9 implemented 2026-07-18 (see each phase's own entry in `02-prd.md` for detail). **Phase 10 — Enterprise — implemented 2026-07-18** (`adr/0009`): a new `Organization`/`Membership` model — every user gets an invisible personal org + `OWNER` membership at registration; `Project` gains `organizationId`, `Goal`/`Task` denormalize it from their parent; any org `MEMBER`+ can read/create/update, only the creator or an `ADMIN`/`OWNER` can archive/delete. A new `services/organizations` (`@pee/organizations`) module owns it, deliberately never imported by `@pee/auth` (a genuine circular-package-dependency bug was found — a real Node.js `require()` cycle, confirmed by a runtime `TypeError` — and fixed by having `AuthService` read `Membership`/`Organization` directly via Prisma instead). `services/execution`/`services/ai`/`services/sync` needed **zero code changes** — verified by tracing that they delegate writes through the retrofitted domain services. SSO is additive: OIDC uses Auth.js's native `type: 'oidc'` provider (this backend only provisions a user after Auth.js's own verified exchange, via a secret-guarded endpoint); SAML has no native Auth.js provider type, so a real SP (`@node-saml/node-saml`) sits behind a self-built OAuth2-shaped façade. Both are feature-flagged off by default. This phase's own security review pass found and fixed two real issues before shipping — a non-constant-time secret comparison and a SAML redirect open-redirect bypass — each with a dedicated regression test. 319 total unit tests passing (up from 256). See [17-phase-status.md](17-phase-status.md), [02-prd.md](02-prd.md) for exit criteria and acceptance status, [18-current-state.md](18-current-state.md) for what's implemented, and `adr/0009-multi-tenancy-rbac-sso.md` for the full architectural rationale.

## Dependency order (§76)

```
Authentication → User Management → Projects → Tasks → Execution Engine → Analytics → Reporting
```

Never implement a dependent feature before its prerequisite phase is complete.
