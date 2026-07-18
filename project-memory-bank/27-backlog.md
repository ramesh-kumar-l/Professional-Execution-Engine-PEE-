# 27 — Backlog

Source of truth for process: `SYSTEM_PROMPT.md` §67, §78 (`System_Prompt/Part4.md`, `Part5.md`). Ideas outside current scope go here instead of interrupting active work.

## Entry format

```
### <Title>
Description:
Reason:
Priority:
Potential dependencies:
Estimated value:
```

## Entries

### OAuth social login
Description: Add Google/GitHub/etc. providers to the Auth.js `Credentials` setup already in place.
Reason: Out of scope for Phase 1 MVP; the auth module and Auth.js config are structured so this is additive config, not a redesign (per `adr/0005`).
Priority: Medium.
Potential dependencies: None blocking.
Estimated value: Reduces registration friction.

### Email verification
Description: Verify a user's email address after registration before granting full access.
Reason: Requires a `notifications`/email-sending service not yet built; deferred out of Phase 1 MVP.
Priority: Medium.
Potential dependencies: A notifications service (SMTP/provider integration).
Estimated value: Reduces fake-account risk.

### Password reset ("forgot password")
Description: Let a user reset a forgotten password via an emailed link/token.
Reason: Same email-delivery dependency as email verification; deferred out of Phase 1 MVP.
Priority: High (before real users onboard).
Potential dependencies: A notifications service (SMTP/provider integration).
Estimated value: Table-stakes account-recovery flow.

### Multi-user project sharing
Description: Let more than one user access/edit a project (membership, per-project roles).
Reason: Out of scope for Phase 2 MVP; single-owner (`ownerId`) model was sufficient until a real feature needed sharing.
Priority: **Resolved by Phase 10** — `Organization`/`Membership` (org-level, not per-project) now provides exactly this: any org `MEMBER`+ can read/create/update a project created by a teammate, only the creator or an `ADMIN`/`OWNER` can archive/delete it. Left here for history; the remaining gap is *per-project* (not per-org) role overrides, which nothing currently needs.
Potential dependencies: None blocking.
Estimated value: Delivered.

### Project templates and tags/labels
Description: Predefined project templates and free-form tags/labels for organizing projects.
Reason: Not needed for the core CRUD data model requested in Phase 2; adding now would be speculative.
Priority: Low.
Potential dependencies: None blocking.
Estimated value: Organizational convenience once the user has many projects.

### Domain-entity audit trail
Description: A general-purpose audit log for project (and future entity) create/update/archive actions, analogous to `AuthAuditLog` but not auth-specific.
Reason: Building this before a second domain entity exists to validate its shape would be speculative; deferred until a real compliance/debugging need identifies what to capture.
Priority: Medium.
Potential dependencies: None blocking; could reuse the `AuthAuditLog` table shape or a new generic `AuditLog` table.
Estimated value: Traceability for support/compliance once real users' data is at stake.

### Task dependencies and scheduling
Description: Let tasks declare dependencies on other tasks (blocking/blocked-by), due dates, and reminders/notifications.
Reason: Out of scope for Phase 3's exit criteria ("goal to plan decomposition, execution loop closed"); this is squarely the Phase 4 (Execution Engine) concern.
Priority: Medium.
Potential dependencies: A notifications service for reminders.
Estimated value: Turns a flat task list into a real schedulable plan.

### Multi-user goal/task collaboration
Description: Let more than one user see/edit goals and tasks within a shared project.
Reason: Out of scope for Phase 3 MVP; single-owner (`ownerId`) model mirrored `Project`'s.
Priority: **Resolved by Phase 10** — `Goal`/`Task` inherit `organizationId` from their parent `Project`, so the same org-membership RBAC (any `MEMBER`+ reads/updates, creator-or-`ADMIN` archives) applies automatically.
Potential dependencies: None blocking.
Estimated value: Delivered.

### Task execution session pause/resume
Description: Let a `TaskExecutionSession` be paused and resumed multiple times instead of a single continuous start→complete span.
Reason: Out of scope for Phase 4's exit criteria ("execution loop observable end-to-end"); a single-span session already makes the loop observable — multi-pause timers are a genuine UX enhancement but add real complexity (which session is "current," how duration sums across gaps) with no consuming feature requiring it yet.
Priority: Low.
Potential dependencies: None blocking.
Estimated value: More accurate time tracking for interrupted work.

### Cross-service distributed tracing / correlation IDs
Description: Propagate a shared trace/correlation ID across every service a request touches, per `docs/standards/observability-and-logging.md`'s "every important workflow must be traceable end-to-end" standard.
Reason: This is a repo-wide, cross-cutting concern — no module (auth, projects, planning, or execution) has it yet. Phase 4's `ExecutionEvent` log solves *product-level* observability (the goal→task loop); infra-level request tracing is a separate, larger initiative better done once across the whole stack than piecemeal per phase.
Priority: Medium.
Potential dependencies: A tracing library/APM choice (OpenTelemetry is the natural default).
Estimated value: Debuggability once the system has more than a couple of services in the request path.

### General domain-entity audit trail for non-status-change actions
Description: Audit-log `Project`/`Goal`/`Task` create/rename/description-edit actions — `ExecutionEvent` (Phase 4) only covers status transitions on `Goal`/`Task`, not `Project` at all and not non-status field edits.
Reason: Building this before a concrete compliance/debugging need identifies what to capture would be speculative — same reasoning as the original Phase 2 "domain-entity audit trail" entry, now narrowed since Phase 4 closed the status-transition slice of it.
Priority: Medium.
Potential dependencies: None blocking; could reuse `ExecutionEvent`'s shape or a separate generic `AuditLog` table.
Estimated value: Full traceability (not just status changes) for support/compliance once real users' data is at stake.

### In-browser offline support for `apps/web`
Description: Retrofit the Next.js frontend itself with real client-side storage (e.g. WASM SQLite + IndexedDB persistence) so the web app is genuinely offline-capable, not just the backend protocol.
Reason: `apps/web` is 100% server-rendered (Server Components + Server Actions, BFF pattern) with zero client-side data fetching today. Phase 5 built the sync protocol and a reusable SQLite reference client (`packages/local-client`); Phase 8 proved it out end-to-end for `apps/desktop`, Phase 9 ported it for `apps/mobile`, but `apps/web`'s own rendering architecture remains unretrofitted — a WASM-SQLite-in-the-browser approach is a materially different problem than either native client's storage engine.
Priority: Low — no current feature needs it; revisit if a real offline-web request emerges.
Potential dependencies: `packages/local-client` (already built and proven by `apps/desktop`; ported for `apps/mobile`).
Estimated value: True Local-First (Principle 2) compliance for the web product itself.

### Sync coverage for `ExecutionEvent` and `TaskExecutionSession`
Description: Extend the sync protocol (`services/sync`) to pull-cache `ExecutionEvent` rows and, separately, decide what cross-device semantics (if any) make sense for an in-progress `TaskExecutionSession`.
Reason: Descoped from Phase 5 to keep the entity registry uniformly bidirectional (3 entries, not a mixed shape); `ExecutionEvent` is already served online by `GET /goals/:goalId/activity`, and session timers are inherently server-driven with unclear cross-device meaning (does starting a task on one device end an open session on another?).
Priority: Low — no offline UI exists yet to consume either.
Potential dependencies: A concrete offline-UI feature that needs the activity timeline or active-session view while disconnected.
Estimated value: Full-fidelity offline experience once a real offline UI exists.

### Encrypt local SQLite files at rest (`apps/desktop` and `apps/mobile`)
Description: Add at-rest encryption (e.g. SQLCipher for desktop's Prisma-backed file; `expo-sqlite`'s own SQLCipher support, or field-level encryption, for mobile's) to both clients' local SQLite database files.
Reason: Both are currently plain-text on disk. Phase 8 shipped `apps/desktop`'s file to `app.getPath('userData')`; Phase 9 shipped a second, structurally different file for `apps/mobile` via `expo-sqlite`. The risk is now live on two device classes — a lost/stolen phone is arguably a more common real-world scenario than a lost desktop.
Priority: High — revisit before any real end-user distribution of either client (not blocking this session's implementation, which has no distribution yet).
Potential dependencies: An SQLCipher-compatible Prisma driver/adapter for desktop (needs research); `expo-sqlite`'s encryption story for mobile (needs research — the two clients will likely need different solutions since they're different storage engines).
Estimated value: Protects offline data on lost/stolen devices, for both client types.

### Multi-device conflict resolution beyond simple last-write-wins
Description: Handle more than two concurrent writers to the same row more richly than "whoever's wall clock is newer wins" (e.g. field-level merge, user-facing conflict resolution UI).
Reason: Phase 5's LWW-by-timestamp is proportional to the current single-device-at-a-time usage pattern (Sustainable Complexity); a genuine multi-device power user editing the same row from two devices within the same minute is an edge case with no reported need yet.
Priority: Low.
Potential dependencies: Telemetry showing real conflict frequency, to justify the added complexity.
Estimated value: Fewer surprised "my edit disappeared" moments for genuinely concurrent multi-device users.

### AIProvider `stream()`/`embed()` methods
Description: Add streaming completions and embeddings to the `AIProvider` interface.
Reason: No shipped feature needs either yet — Phase 6 built only `complete()`, deliberately (Sustainable Complexity). `embed()` would matter for a future retrieval/RAG feature; `stream()` for a real-time chat-style UI.
Priority: Low — revisit when a concrete feature needs one.
Potential dependencies: A feature that specifically requires streamed output or vector search.
Estimated value: Unlocks a different class of AI feature than request/response completions.

### Automatic multi-provider failover for AIProvider
Description: If the active provider (Anthropic or OpenAI) errors or times out, automatically retry against the other configured vendor instead of surfacing an error.
Reason: Phase 6 deliberately chose single-active-provider (config-selected) over automatic failover — doubling cost on every degraded call and making "which model produced this recommendation" non-deterministic, which undermines explainability. No reliability data yet justifies the added complexity.
Priority: Low — revisit only if real failure-rate telemetry demands it.
Potential dependencies: Both vendors' API keys configured simultaneously; a policy for how a failover changes the "model" field shown to the user.
Estimated value: Higher uptime for AI-native features if a single vendor has an outage.

### Additional AI-native features beyond task-breakdown suggestions
Description: Goal/project progress narratives, smart task prioritization, natural-language task capture ("add a task from this sentence"), and other candidates from `09-ai-architecture.md`'s governing rules.
Reason: Phase 6 shipped one concrete, well-built feature (goal → task-breakdown suggestions) to prove the `AIProvider` abstraction end-to-end, per Sustainable Complexity — not a grab-bag of AI features.
Priority: Medium — natural Phase 7+ candidates, each individually scoped against the quality bar.
Potential dependencies: `AIModule`/`AIProvider` (already built, ready to be reused).
Estimated value: Each feature compounds on the same infrastructure investment.

### AI-recommendation sync coverage
Description: Extend the sync protocol (`services/sync`) to cover `AIRecommendation` so pending/past AI suggestions are visible offline.
Reason: Descoped from Phase 5 (didn't exist yet) and Phase 6 (no offline UI exists yet to need it) — same precedent as `TaskExecutionSession`/`ExecutionEvent`.
Priority: Low — no offline UI exists yet to consume it.
Potential dependencies: A concrete offline-UI feature.
Estimated value: Full-fidelity offline experience once a real offline UI exists.

### AI usage/cost tracking
Description: Record token usage/cost per `AIRecommendation` (already captured in each provider's `AICompletionResult.usage`, but not persisted) and surface it for cost monitoring.
Reason: Not needed to prove the feature works; a real operational concern once real users generate real volume against paid vendor APIs.
Priority: Medium — revisit before enabling this feature for real users at scale.
Potential dependencies: None blocking; `usage` is already computed by both providers, just needs a column and a dashboard.
Estimated value: Cost visibility and abuse detection.

### Real vendor-credentialed smoke test for `services/ai`
Description: A manual (or scheduled, credentialed) test that actually calls the live Anthropic/OpenAI APIs, verifying wire compatibility beyond the mocked unit tests and fake-provider e2e.
Reason: No automated test in this repo exercises a real network call to either vendor — normal for third-party LLM integrations authored without live credentials, but a real gap before production reliance.
Priority: High — before this feature is relied on with real users.
Potential dependencies: Real `ANTHROPIC_API_KEY`/`OPENAI_API_KEY` credentials in a controlled environment.
Estimated value: Confidence the provider implementations actually work against the real vendor APIs, not just their documented shape.

### Materialized analytics rollups
Description: Precompute analytics aggregates (a summary table, incremental counters, or a scheduled job) instead of computing every `/analytics/*` response live from `TaskExecutionSession`/`ExecutionEvent`/status fields at request time.
Reason: Phase 7 deliberately chose live query aggregation — current per-user data volumes are small, and a rollup table/job would be speculative infrastructure plus a new staleness concern for a load that doesn't exist yet (Sustainable Complexity, Principle 8).
Priority: Low — revisit only if real usage data shows query cost becoming a problem.
Potential dependencies: Telemetry showing actual query latency/cost at scale.
Estimated value: Lower per-request cost for accounts with very large history, once that's a real (not hypothetical) problem.

### Analytics charting/visualization upgrade
Description: Replace `/dashboard/analytics`'s plain tables with real charts (line/bar) for the velocity and time-tracking views.
Reason: Phase 7 kept the frontend dependency-free and consistent with the rest of `apps/web`'s minimal, 100%-server-rendered UI (no charting library, no client components) — a real visual upgrade is a reasonable follow-up, not a Phase 7 blocker.
Priority: Low.
Potential dependencies: A charting library choice (adds a new frontend dependency and likely a client component, a first for `apps/web`).
Estimated value: Easier at-a-glance trend reading than a table of numbers.

### Sync coverage for analytics data
Description: If a future offline UI needs to show analytics while disconnected, extend the sync protocol or add a dedicated offline cache for `/analytics/*` responses.
Reason: `@pee/analytics` has no persisted rows of its own (pure computed reads over other tables) — there's nothing to add to the Phase 5 sync registry today, but a future offline analytics view would need its own caching strategy, not a registry entry.
Priority: Low — no offline UI exists yet to need it.
Potential dependencies: A concrete offline-UI feature (same precedent as `ExecutionEvent`/`AIRecommendation`'s sync-coverage backlog entries).
Estimated value: Full-fidelity offline experience once a real offline UI exists.

### Desktop code signing, auto-update, and cross-platform CI packaging matrix
Description: Add real code-signing certificates (Windows/macOS), an auto-update mechanism (e.g. `electron-updater` against a release feed), and a CI job that builds/packages `apps/desktop` for win/mac/linux.
Reason: Phase 8 deliberately shipped an unsigned local-build-only `electron-builder.yml` — signing certs and a packaging matrix are a distribution concern, not a "does the reused API/local-client work" concern, and attempting either without real credentials would produce untested config.
Priority: Medium — required before any real end-user distribution of `apps/desktop`, not before.
Potential dependencies: Signing certificates/accounts (Apple Developer ID, a Windows code-signing cert), a release-hosting choice for the update feed.
Estimated value: Makes `apps/desktop` actually distributable and self-updating, not just runnable from source.

### IPC payload validation for `apps/desktop`
Description: Add `class-validator`-style validation at the IPC boundary (`projects-ipc.ts`/`goals-ipc.ts`/`tasks-ipc.ts`/etc.), mirroring the `whitelist`/`forbidNonWhitelisted` discipline every HTTP DTO already has.
Reason: Currently these handlers pass renderer-supplied fields straight to `LocalStore`. The renderer is code this project authored and is sandboxed (`contextIsolation`/`sandbox`), so the risk is lower than a public endpoint, but a compromised renderer dependency is a realistic desktop threat model this doesn't yet defend against.
Priority: Medium.
Potential dependencies: None blocking — same `class-validator`/`class-transformer` already used everywhere else in the codebase.
Estimated value: Closes a real, if narrow, gap in defense-in-depth for the desktop client.

### Extend the sync scope for offline execution/AI/analytics on desktop and mobile
Description: Cover `TaskExecutionSession`/`ExecutionEvent`/`AIRecommendation` (and a caching strategy for analytics) so `apps/desktop` and `apps/mobile` both have a fuller offline story beyond Project/Goal/Task CRUD.
Reason: Both Phase 8 and Phase 9 deliberately kept their offline scope identical to the Phase 5 sync registry's three bidirectional entities rather than widening it (that widening would itself be a form of "rewrite" of the reused/ported protocol). Execution start/complete, AI suggestions, and analytics are online-only passthroughs on both clients today — a real UX gap for a genuinely offline session on either device, but not one either phase's exit criteria required closing.
Priority: Medium — natural next step once either client has real users hitting the online-only gap.
Potential dependencies: Same cross-device-semantics questions the existing "Sync coverage for `ExecutionEvent` and `TaskExecutionSession`" backlog entry already raises; would need to be designed once and then applied to both `packages/local-client` and `apps/mobile`'s ported equivalent.
Estimated value: A desktop or mobile session that works fully offline, not just for planning data.

### Run `apps/mobile`'s Detox e2e spec on a real device/CI runner
Description: Execute `apps/mobile/e2e/mobile.e2e.ts` against a real Android emulator or iOS Simulator (locally, or via a CI runner with one available) to confirm the app actually launches and renders as expected — the mobile equivalent of what `apps/desktop`'s Playwright/Electron e2e already achieved.
Reason: This authoring sandbox has no Android SDK/emulator or macOS+Xcode/Simulator available, and unlike Electron there is no headless-launch workaround for Detox. The spec and `.detoxrc.js` config are written and ready; only the runtime environment is missing.
Priority: Medium — genuinely verifies the one thing Jest unit tests can't (the real app actually launching on a real or emulated device).
Potential dependencies: An Android emulator/AVD or iOS Simulator, either locally or in a CI runner (e.g. GitHub Actions' macOS runners for iOS, or an Android emulator action for Android).
Estimated value: Closes this project's one remaining "written but never run" e2e gap that isn't blocked on Docker/Postgres.

### EAS cloud build and code signing for `apps/mobile`
Description: Add real EAS Build credentials (Apple/Google signing) and a production `eas.json` profile so `apps/mobile` can be built into an installable, signed app rather than only run via `expo start`/local dev builds.
Reason: Phase 9 deliberately scoped `eas.json` to dev/preview profiles only — signing credentials and a production build pipeline are a distribution concern, not a "does the ported protocol work" concern, mirroring Phase 8's identical decision for `electron-builder`.
Priority: Medium — required before any real end-user distribution of `apps/mobile`, not before.
Potential dependencies: An Expo/EAS account, Apple Developer Program membership, Google Play Console access.
Estimated value: Makes `apps/mobile` actually installable on a real device outside of Expo Go/dev builds.

### Payload validation for `apps/mobile`'s direct `MobileStore` calls
Description: Add `class-validator`-style validation before screens call `MobileStore.createProject`/`createGoal`/`createTask` etc., mirroring the `whitelist`/`forbidNonWhitelisted` discipline every HTTP DTO already has, and the same gap already tracked for `apps/desktop`'s IPC boundary.
Reason: Currently screens pass form input straight to `MobileStore`. The code is authored by this project (not arbitrary internet input), so the risk is lower than a public endpoint, but a compromised dependency in the RN bundle is a realistic threat model this doesn't yet defend against.
Priority: Medium — same priority and reasoning as the existing `apps/desktop` IPC-validation entry.
Potential dependencies: None blocking — same `class-validator`/`class-transformer` already used everywhere else in the codebase.
Estimated value: Closes a real, if narrow, gap in defense-in-depth for the mobile client.

### Dependency upgrade: Nest 11 / Next 16
Description: `npm audit` (2026-07-17) flags advisories in the NestJS 10.x/Express chain and Next.js 14.x that only clear via a major-version bump.
Reason: Deliberately not force-upgraded mid-Phase-1 to avoid pulling in untested majors without dedicated regression testing. See [20-known-issues.md](20-known-issues.md), [21-decision-log.md](21-decision-log.md).
Priority: Medium — no active exploit path identified for this app's usage, but should not sit indefinitely.
Potential dependencies: None blocking; standalone upgrade task.
Estimated value: Clears known CVEs, keeps the stack current.

### Extend org-wide visibility to execution sessions, AI suggestions, and analytics
Description: `services/execution`/`services/ai` already inherit org-membership access for free (they delegate through `@pee/planning`'s services), but nothing in their own UI/response shape surfaces "which teammate is doing what" — and `services/analytics` stays strictly owner-scoped, computing metrics only over the caller's own rows, not the whole org's.
Reason: Phase 10 deliberately drew the line at "any code that already delegates through the retrofitted domain services inherits org-scoping automatically" and did not widen `@pee/analytics` (which bypasses those services by design) or add any new org-aware UI. Widening either is real new work, not a retrofit.
Priority: Medium — natural next step once a team actually wants "what is my org doing" visibility, not just "can my teammates edit my project."
Potential dependencies: None blocking for execution/AI; `@pee/analytics` would need `organizationId`-scoped query variants added alongside (not instead of) its existing owner-scoped ones.
Estimated value: Turns "my teammate can edit my project" into "I can see what my team is actually doing."

### Email-token-based organization invites
Description: Replace `MembershipManagementService.inviteMember`'s current "must already have a PEE account" requirement with a real emailed invite-link/token flow that provisions a new account on acceptance.
Reason: Phase 10 deliberately scoped invite-by-email to linking an *existing* user only, same deferred-email-service precedent as the "Email verification"/"Password reset" backlog entries — no notifications service exists yet to send an invite email.
Priority: High — this is a real, felt gap for onboarding genuinely new teammates (not just linking two people who already separately signed up), and it also closes the email-enumeration side-channel the current lookup-based approach has (see [12-security.md](12-security.md)).
Potential dependencies: A notifications service (SMTP/provider integration) — same dependency the two pre-existing email-flow backlog entries need.
Estimated value: Makes org onboarding actually usable for a real team, not just a demo of two pre-existing accounts.

### SAML SLO, multi-IdP support, encrypted assertions, and bridge client-credential validation
Description: The SAML SP built in Phase 10 is deliberately scoped to SP-initiated login only, a single configured IdP, unencrypted (signed-only) assertions, and no `client_id`/`client_secret` validation on the OAuth2-façade bridge's `token` endpoint (a single self-hosted client — `apps/web` — is assumed).
Reason: Each of these is real SAML SP functionality that a genuine enterprise rollout would eventually need, but none was required to satisfy "SAML as an additive Auth.js provider" for a first implementation — building all of them now would be speculative before any real enterprise customer's IdP requirements are known.
Priority: Medium — revisit once a real enterprise customer's IdP configuration actually requires one of these (e.g. they mandate SLO, or there's a second SAML-only tenant).
Potential dependencies: None blocking for a first customer; multi-IdP would need a per-organization IdP-configuration model (currently global env vars, one IdP for the whole deployment).
Estimated value: Table-stakes for larger enterprise SSO rollouts once one is actually needed.

### P1 hardening items from the 2026-07-18 production-hardening audit
Description: A batch of independently-audited, non-blocking findings, each small enough not to need its own entry: (1) `GoalsService.list()` N+1 — per-goal `task.count` calls instead of one grouped aggregate; (2) `services/sync`'s push loop processes changes one at a time instead of batching/transacting them, so a large offline catch-up sync has unbounded worst-case latency; (3) add composite indexes matching actual filter+sort patterns as org-scale data volume arrives; (4) catch the Prisma `P2002` duplicate-registration race in `AuthService.register` and return 409 instead of an unhandled 500; (5) the SAML bridge's one-time-code replay-guard `Set` (`SamlBridgeService`) never evicts expired entries — unbounded memory growth on a long-lived process (the multi-instance shared-store version of this gap is already tracked separately below); (6) decide and implement API versioning before more client code (3 platforms already) binds to unversioned paths; (7) `/organizations` and `/organizations/:id/members` list endpoints return a bare array instead of the `PaginatedResponse<T>` shape every other list endpoint uses; (8) add a Dependabot config + `npm audit` CI gate — currently zero automated dependency-vulnerability scanning; (9) rewrite the root `README.md` with real setup/run/test instructions instead of requiring a new engineer to already know to read `CLAUDE.md`.
Reason: None of these block a release on their own (unlike the P0 items the same audit found — migration/CI verifiability and no deployment target — which were fixed directly, see [17-phase-status.md](17-phase-status.md)), but each is a real, verified-against-code finding worth closing before this system carries real production load.
Priority: Medium — closing item 4 (register race → 500) and item 8 (dependency scanning) first is reasonable; the rest can follow in any order.
Potential dependencies: None blocking any individual item.
Estimated value: Removes the last verified-real gaps between "hardened for a pilot" and "hardened for unattended production."

### Real OIDC/SAML browser login round-trip against a live or locally-mocked IdP
Description: Actually drive `apps/web`'s full SSO login flow through a browser against a real IdP (Okta/Azure AD/etc.) or a locally-hosted mock one, the way `apps/desktop`'s Playwright e2e genuinely launched the real app.
Reason: This sandbox has no way to register a real IdP client or stand up a second mock-IdP server alongside Playwright. The SAML SP's cryptographic core *is* genuinely unit-tested (fail-closed against garbage/unsigned input, real `@node-saml/node-saml`, no mock) and `SsoProvisioningService` is fully unit-tested, but the full browser round-trip is not.
Priority: Medium-High — this is this phase's one remaining "written but never run end-to-end" gap, mirroring `apps/mobile`'s Detox gap from Phase 9.
Potential dependencies: A real IdP test tenant (Okta/Azure AD developer account) or a self-hosted mock IdP (e.g. a local `oidc-provider` instance) reachable from a Playwright test run.
Estimated value: Closes the one remaining "never actually seen it work in a browser" gap for Phase 10's headline feature.
