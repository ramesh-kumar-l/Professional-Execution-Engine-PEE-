# 29 — Next Task

**Priority 5 load** — read every session (`claude/STARTUP.md`).

## Immediate next task

None active — Phase 1 (Authentication) through Phase 10 (Enterprise) are complete. **Phase 10 was the last phase currently defined in the roadmap** — there is no next phase awaiting scope. Remaining work lives entirely in [27-backlog.md](27-backlog.md).

## Recommended next step

No product phase to scope. If picking this project back up, the highest-value steps are all backlog/hardening work, roughly in priority order:

1. **Docker + Postgres:** `docker compose -f infrastructure/docker/docker-compose.dev.yml up -d`, then `npx prisma migrate dev --name init --schema packages/database/prisma/schema.prisma` (the **first-ever** migration — none exists for any phase's tables yet), then run every Docker-dependent e2e suite: `npm run test:e2e -w @pee/auth`, `-w @pee/organizations` (**new, Phase 10**), `-w @pee/projects`, `-w @pee/planning`, `-w @pee/execution`, `-w @pee/sync`, `-w @pee/local-client`, `-w @pee/ai`, `-w @pee/analytics`, and `-w web` (now including `organizations.spec.ts`). All written and wired into CI but never executed in the authoring sandbox — `apps/desktop`'s e2e is the one exception (needs no Postgres, already run).
2. **A mobile device/emulator:** run `apps/mobile`'s Detox e2e spec (`apps/mobile/e2e/mobile.e2e.ts`) — written and CI-wired but never executed here.
3. **A real or locally-hosted test IdP:** exercise the full OIDC/SAML browser login round-trip end-to-end — the SAML SP's cryptographic core is genuinely unit-tested against the real `@node-saml/node-saml` library, but the full browser flow through a live IdP has not been attempted.
4. **Real AI vendor credentials:** run a real smoke test of `services/ai` (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`) before relying on it in production.
5. **Local SQLite file-at-rest encryption** on `apps/desktop` and `apps/mobile` before either reaches real users.
6. Beyond that: SAML SLO/multi-IdP/encrypted-assertions/client-credential-validation, email-token-based org invites, org-wide visibility for execution/AI/analytics, desktop code signing/mobile EAS builds, and every other item in [27-backlog.md](27-backlog.md).

If new product requirements emerge, scope them as a new phase (11+) the same way Phase 10 was scoped: read the exit criteria literally, trace the actual code before assuming what needs to change, and update this memory bank at the end. Use `/implement-feature` or `/backend-workflow`.

Full roadmap: [16-roadmap.md](16-roadmap.md). Current status: [17-phase-status.md](17-phase-status.md).
