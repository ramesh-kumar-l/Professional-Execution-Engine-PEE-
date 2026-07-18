# 19 — Active Work

**Priority 4 load** — read every session (`claude/STARTUP.md`). This is the "active context" save-state file.

## Current phase / epic / feature / task

- **Phase:** 10 — Enterprise — **complete**.
- **Epic:** Multi-tenant/RBAC/SSO (OIDC/SAML as additive Auth.js provider). **Complete.**
- **Feature / Task:** None active. Phase 10 was the last phase defined in the roadmap — no further product phase is currently scoped.
- **Subtask:** n/a.

## Completion percentage

EOS bootstrap (Phase 0): 100%. Architecture ADRs (Phase 0.5): 100%. Phases 1-9: 100% each (see `17-phase-status.md` for detail). Phase 10 (Enterprise): 100% of scoped work — `Organization`/`Membership` model with request-scoped (not session-scoped) resolution, RBAC retrofit of `ProjectsService`/`GoalsService`/`TasksService` (zero changes needed in `@pee/execution`/`@pee/ai`/`@pee/sync`), SSO (OIDC via Auth.js's native provider, SAML via a self-built SP behind an OAuth2 façade), `apps/web` org UI, 319 total unit tests passing, a real circular-package-dependency bug found and fixed, two real security issues found and fixed (non-constant-time secret comparison, SAML redirect open-redirect bypass) with dedicated regression tests. Overall project (Phase 0-10): **all phases done.**

## Known blockers

None blocking — there is no next phase to scope. Carried-forward gaps, all requiring Docker/Postgres, a mobile device/emulator, a live SSO IdP, or real AI vendor credentials, none of which have been available in any session so far:
1. Integration/e2e tests across every service (`services/auth`, **`services/organizations` (new)**, `services/projects` (extended), `services/planning`, `services/execution`, `services/sync`, `packages/local-client`, `services/ai`, `services/analytics`, `apps/web/e2e/*.spec.ts` including the new `organizations.spec.ts`) have never been run against a real Postgres. **Not applicable to `apps/desktop/e2e/desktop.spec.ts`** — that one needs no Postgres/Docker and was actually run successfully in Phase 8's session.
2. `apps/mobile/e2e/mobile.e2e.ts` (Detox) has not been run — no Android emulator/iOS Simulator available, and unlike Electron there is no headless-launch fallback for Detox.
3. No Prisma migration has ever been generated (`prisma/migrations/` doesn't exist), so `prisma migrate deploy` (CI/prod) currently has nothing to apply.
4. Carried forward from Phase 6, unchanged: no automated test exercises a real network call to the live Anthropic/OpenAI APIs.
5. Carried forward from Phase 8/9, unchanged: both `apps/desktop`'s and `apps/mobile`'s local SQLite files are unencrypted at rest.
6. New this phase: neither OIDC nor SAML SSO has been exercised against a real or fully browser-mocked IdP in this sandbox — the SAML SP's cryptographic assertion-validation path *does* have a genuine, passing unit test (fail-closed against garbage/unsigned input, using the real `@node-saml/node-saml` library), and `SsoProvisioningService`'s find-or-create logic is fully unit-tested, but a full end-to-end browser login round-trip against a live IdP has not been attempted. Honestly documented, same class of gap as Detox/AI-vendor.

See [20-known-issues.md](20-known-issues.md).

## Upcoming work

No further product phase is scoped — Phase 10 was the last one defined. Recommended next steps, all tracked in [27-backlog.md](27-backlog.md), roughly in priority order:
1. Generate the first Prisma migration (`npx prisma migrate dev --name init`) and run every Docker-dependent test suite at least once, in an environment with Docker.
2. Run `apps/mobile`'s Detox e2e spec on a real Android emulator/iOS Simulator.
3. Local SQLite file-at-rest encryption on `apps/desktop` and `apps/mobile` before either reaches real users.
4. A real vendor-credentialed smoke test of `services/ai`.
5. A real OIDC/SAML login round-trip against a live or locally-hosted test IdP, once one is available.
6. SAML SLO, multi-IdP support, encrypted assertions, and client-credential validation on the bridge's `token` endpoint.
7. Email-token-based org invites (current invite only links an existing PEE user by email — a real gap before onboarding genuinely new teammates).
8. Extending org-wide visibility to execution sessions/AI suggestions/analytics (all three deliberately stayed owner-scoped in Phase 10).

## Estimated next milestone

None currently scoped — all defined product phases (0 through 10) are complete. The project is in a "harden and productionize the backlog" posture rather than a "build the next phase" one.
