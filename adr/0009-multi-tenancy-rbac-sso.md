# ADR-0009: Multi-Tenancy, RBAC, and SSO

- **Status:** Accepted
- **Date:** 2026-07-18
- **Phase:** 10 (Enterprise)

## Problem

Every domain entity (`Project`/`Goal`/`Task`) has been single-owner (`ownerId` scalar FK to `User`) since Phase 1, checked via a `findOwnedOrThrow` helper repeated identically in `ProjectsService`/`GoalsService`/`TasksService` that returns 404 (never 403) on any mismatch. `UserRole` has exactly one value (`USER`). Auth is email/password only. Phase 10's exit criteria — Multi-tenant/RBAC/SSO (OIDC/SAML as additive Auth.js provider) — is the first phase whose scope is a from-scratch cross-cutting retrofit rather than a new module bolted onto stable ground.

## Context

- `services/execution`, `services/ai`, and `services/sync` all delegate their writes through `ProjectsService`/`GoalsService`/`TasksService` rather than raw Prisma (the "reuse domain services" discipline established in Phases 4-6). Retrofitting organization-membership checks into exactly those three services' shared ownership-check pattern therefore extends multi-tenant collaboration to execution sessions and AI suggestions for free.
- `@pee/analytics` bypasses domain services by design (the Phase 4/7 "read-only-direct-Prisma" carve-out) and stays owner-scoped in this phase — a documented boundary, not an oversight.
- Auth.js (NextAuth v5) has a native `type: 'oidc'` provider — it runs the entire OIDC exchange itself (discovery, PKCE, state, nonce, token exchange). It has **no native SAML provider type.**
- `services/organizations`' controllers need `CurrentUser`/`JwtAuthGuard` from `@pee/auth`. `AuthService` needs to read `Organization`/`Membership` data (to build `UserProfile.organizations` and to create a personal org at registration). A naive design where `@pee/auth` imports `OrganizationsService` from `@pee/organizations` creates a **circular package dependency** — not just a Nest DI-graph cycle (which `forwardRef` could paper over), but a genuine Node.js CommonJS `require()` cycle: confirmed by a runtime `TypeError: (0, auth_1.CurrentUser) is not a function` when tried, because `@pee/auth`'s `index.js` requires `@pee/organizations`'s `index.js` partway through its own initialization, which requires `@pee/auth` back and gets the not-yet-fully-populated module object.

## Options Considered

**Tenancy model:**
1. Full multi-tenant remodel: every table gains `organizationId`, `ownerId` is removed, authorization becomes purely role-based.
2. Additive `Organization`/`Membership` alongside the existing `ownerId`, with a stateful "active organization" concept in the session.
3. Additive `Organization`/`Membership` alongside `ownerId`, with organization resolved per-request/per-resource — no session state.

**SSO for SAML specifically (no native Auth.js provider exists):**
1. Skip SAML, ship OIDC only.
2. Build a real SAML Service Provider and expose it to Auth.js as a generic `type: 'oauth'` provider via a small façade.
3. Adopt a third-party SAML-to-OIDC bridge service (e.g. BoxyHQ Jackson) instead of building one.

**The `@pee/auth` ⇄ `@pee/organizations` cycle:**
1. `forwardRef()` on both sides.
2. Event-driven decoupling (`@pee/auth` emits `user.registered`, `@pee/organizations` listens).
3. `@pee/auth` never imports `@pee/organizations`; it reads `Membership`/`Organization` directly via Prisma and duplicates the small personal-org-creation insert.

## Decision

**Tenancy: Option 3.** New `Organization` (`id`, `name`, `isPersonal`) and `Membership` (`organizationId`, `userId`, `role`: `OWNER`/`ADMIN`/`MEMBER`) tables. `AuthService.register()` creates one `isPersonal: true` `Organization` + `OWNER` `Membership` per user in the same `$transaction` as the `User` insert — every pre-existing single-user flow keeps working unchanged underneath an invisible personal workspace. `Project` gains `organizationId` (NOT NULL FK); `Goal`/`Task` denormalize it from their parent at creation time, exactly like they already denormalize `ownerId`. `ownerId` is kept everywhere as "creator," used only for destructive-permission checks (archive/delete require the creator or an org `ADMIN`/`OWNER`; read/create/update require only `MEMBER`). There is no stateful "active organization" — `CreateProjectDto.organizationId` is optional (defaults to the caller's personal org), `GET /projects?organizationId=` is optional (defaults to every org the caller belongs to). An "org switcher" in `apps/web` is a pure UI convenience (a link with a query param), nothing server-side to switch. Not-a-member stays 404 (existence-hiding, unchanged discipline); member-but-insufficient-role is 403 — a deliberate, narrow exception to the blanket 404-not-403 rule, since being a member of an org you can already see doesn't newly disclose anything.

**SSO: Option 2 for SAML, native provider for OIDC.** OIDC is Auth.js's own `type: 'oidc'` provider — the only new backend surface is a secret-header-guarded `POST /auth/sso/oidc/provision` that Auth.js's `profile()` callback calls after it has already verified the id_token itself. SAML has no native Auth.js provider type, so `services/auth/src/sso/saml/` implements a real SP (`@node-saml/node-saml`) behind a minimal OAuth2-authorization-code façade (`SamlBridgeService`: short-lived signed-JWT codes/tokens, not DB rows) so Auth.js's generic `type: 'oauth'` provider can drive it exactly like any OAuth IdP — the same architecture real SAML-to-OIDC bridges (BoxyHQ Jackson) use, built in-house rather than adopting a third-party service (Option 3) to avoid a new external dependency for a single-IdP, single-tenant-of-our-own use case. Both OIDC and SAML funnel through one `SsoProvisioningService.findOrCreateUser`. Both are feature-flagged off by default (missing env → 503, `GET /auth/sso/status` tells `apps/web` which buttons to render) — the same fail-closed posture as Phase 6's AI-provider-key requirement.

**The circular dependency: Option 3.** `AuthService` reads `Membership`/`Organization` directly via Prisma (the same read-only-direct-Prisma carve-out `@pee/analytics` already uses — this is a self-scoped read, no cross-user authorization decision rests on it) and duplicates the ~3-line org+membership insert in `createUserWithPersonalOrganization` rather than calling into `OrganizationsService`. `@pee/organizations` is never imported by `@pee/auth`. Option 1 (`forwardRef`) was rejected because the problem is a plain Node.js module-loading cycle, not a Nest DI-graph one — `forwardRef` doesn't fix a broken `require()` order. Option 2 (events) was rejected because registration should either fully succeed or fully fail before returning to the caller; an eventual-consistency event-emit path is a worse fit than the small, explicit duplication, and this project already accepts small bounded raw-Prisma exceptions elsewhere (`services/sync`'s atomic version-guard) when the alternative is architecturally worse.

## Trade-offs

Gained: zero code changes needed in `services/execution`, `services/ai`, `services/sync`, `packages/local-client`, `apps/desktop`, or `apps/mobile` — confirmed by tracing that `services/sync`'s `toChangeRecord`/`applyCreate` never include or forward `organizationId`, so synced offline-created rows silently land in the caller's default personal org. Real, tested RBAC (any member reads/updates, only creator/admin destroys) rather than a stub. Given up: a small, deliberate logic duplication between `AuthService.createUserWithPersonalOrganization` and what would otherwise live in `OrganizationsService` (documented, bounded, low-drift-risk — it's 3 lines). The SAML bridge's one-time-code replay guard is an in-memory `Set`, a documented limitation for multi-instance deployments (tracked in `27-backlog.md`). No client-credential validation on the SAML bridge's `token` endpoint (single self-hosted client assumed) — tracked as a known gap, not silently accepted.

## Migration Impact

Adds `Organization`, `Membership`, `SsoIdentity` tables and `organizationId` to `Project`/`Goal`/`Task`; `User.passwordHash` becomes nullable (an SSO-only user has no password at all, not a placeholder hash). No migration file has ever been generated for this project (same carried-forward Docker-dependent gap since Phase 1) — these are additive `schema.prisma` changes only, not a live migration.

## Alternatives Rejected

Tenancy Option 1 (full remodel, drop `ownerId`) rejected: destructive-permission checks and sync's existing `ownerId`-keyed conflict semantics both still need a "who created this" concept; removing it would be a genuine rewrite, not an additive retrofit. Tenancy Option 2 (stateful active-org session) rejected: it would be the first stateful concept in an otherwise fully stateless JWT/session model, for no capability a request-scoped `organizationId` parameter doesn't already provide. SSO Option 1 (skip SAML) rejected: the exit criteria names it explicitly. SSO Option 3 (third-party bridge service) rejected: introduces a new external dependency and account for a capability buildable in-house at a bounded, well-precedented scope (SP-initiated only, single IdP, no SLO, no encrypted assertions — all explicitly deferred to backlog).

## Memory Bank Reference

`08-backend-guidelines.md`, `10-database-design.md`, `11-api-contract.md`, `12-security.md`, `project-memory-bank/02-prd.md` (Phase 10 entry), `27-backlog.md` (SAML SLO/multi-IdP/client-credential-validation, org-visibility for execution/AI/analytics, email-token-based invites).
