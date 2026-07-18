# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 10 — Enterprise — **complete**. Post-Phase-10 Production Hardening (P0) — **complete (2026-07-19)**.
- **Epic:** Multi-tenant/RBAC/SSO (OIDC/SAML as additive Auth.js provider). **Complete.**
- **Feature / Task:** None active. Phase 10 was the last product phase defined in the roadmap, and the P0 hardening pass triggered by the 2026-07-18 audit is closed — no further product phase or P0 item is currently scoped.
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phases 1-9: 100% each (see `17-phase-status.md` for detail). Phase 10 (Enterprise): 100% of scoped work. **Post-Phase-10 Production Hardening (P0): 100%** — of the 7 P0 items an independent audit identified (CI migration no-op, no deployment target, no structured logging, no client-side timeouts, fake health check + no graceful shutdown, no boot-time env validation, SSO config/secret gaps), all 7 are fixed; see `17-phase-status.md`'s "Post-Phase-10 — Production Hardening (P0)" section for detail. 328 total unit tests passing (up from 319). Overall project (Phase 0-10 + P0 hardening): **all currently-scoped work done.**

## Known blockers

None blocking — there is no next phase or P0 item to scope. Carried-forward gaps, all requiring Docker/Postgres, a mobile device/emulator, a live SSO IdP, or real AI vendor credentials, none of which have been available in any session so far:
1. Integration/e2e tests across every service (`services/auth`, `services/organizations`, `services/projects`, `services/planning`, `services/execution`, `services/sync`, `packages/local-client`, `services/ai`, `services/analytics`, `apps/web/e2e/*.spec.ts`) have never been run against a real Postgres — **but there is now a real migration for them to run against** (`packages/database/prisma/migrations/20260719000000_init/`, added 2026-07-19), where previously `migrate deploy` silently had nothing to apply. Re-verifying every suite genuinely passes against the real resulting schema is the highest-value next step once Docker is available. **Not applicable to `apps/desktop/e2e/desktop.spec.ts`** — that one needs no Postgres/Docker and was actually run successfully in Phase 8's session.
2. `apps/mobile/e2e/mobile.e2e.ts` (Detox) has not been run — no Android emulator/iOS Simulator available, and unlike Electron there is no headless-launch fallback for Detox.
3. The new `infrastructure/docker/api.Dockerfile`/`web.Dockerfile` have not been through a real `docker build`/`docker run` — no Docker daemon in this sandbox. Every command inside each was verified via its non-Docker equivalent (`next build`, `tsc`, `prisma generate`) instead.
4. Carried forward from Phase 6, unchanged: no automated test exercises a real network call to the live Anthropic/OpenAI APIs.
5. Carried forward from Phase 8/9, unchanged: both `apps/desktop`'s and `apps/mobile`'s local SQLite files are unencrypted at rest.
6. Carried forward from Phase 10, unchanged: neither OIDC nor SAML SSO has been exercised against a real or fully browser-mocked IdP in this sandbox.

See [20-known-issues.md](20-known-issues.md).

## Upcoming work

No further product phase or P0 item is scoped. Recommended next steps, all tracked in [27-backlog.md](27-backlog.md), roughly in priority order:
1. In an environment with Docker: run every Docker-dependent e2e suite against the now-real migration for the first time, and do a real `docker build`/`docker run` round-trip on both new Dockerfiles.
2. Run `apps/mobile`'s Detox e2e spec on a real Android emulator/iOS Simulator.
3. Action the audit's P1 list ("P1 hardening items from the 2026-07-18 production-hardening audit" in `27-backlog.md`) — the `Goal.list()` N+1, unbatched sync push, missing composite indexes, no dependency-vulnerability scanning, no API versioning decision, `/organizations` pagination inconsistency, thin README.
4. Local SQLite file-at-rest encryption on `apps/desktop` and `apps/mobile` before either reaches real users.
5. A real vendor-credentialed smoke test of `services/ai`.
6. A real OIDC/SAML login round-trip against a live or locally-hosted test IdP, once one is available.
7. SAML SLO, multi-IdP support, encrypted assertions, and client-credential validation on the bridge's `token` endpoint.
8. Email-token-based org invites (current invite only links an existing PEE user by email — a real gap before onboarding genuinely new teammates).
9. Extending org-wide visibility to execution sessions/AI suggestions/analytics (all three deliberately stayed owner-scoped in Phase 10).

## Estimated next milestone

None currently scoped — all defined product phases (0 through 10) and the triggered P0 hardening pass are complete. The project is in a "harden and productionize the backlog" posture rather than a "build the next phase" one.
