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
Reason: Out of scope for Phase 2 MVP; single-owner (`ownerId`) model is sufficient until a real feature needs sharing.
Priority: Medium.
Potential dependencies: A permissions/roles model beyond the current single `role` field on `User`.
Estimated value: Needed once any collaborative feature (e.g. shared Tasks) exists.

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
Reason: Out of scope for Phase 3 MVP; single-owner (`ownerId`) model mirrors `Project`'s and is sufficient until a real collaborative feature needs it — same reasoning as the existing multi-user project sharing entry.
Priority: Medium.
Potential dependencies: Same permissions/roles model gap noted for multi-user project sharing.
Estimated value: Needed once teams (not just individuals) use the product.

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
Reason: `apps/web` is 100% server-rendered (Server Components + Server Actions, BFF pattern) with zero client-side data fetching today. Phase 5 built the sync protocol and a reusable SQLite reference client (`packages/local-client`); Phase 8 proved it out end-to-end for `apps/desktop`, but `apps/web`'s own rendering architecture remains unretrofitted — a WASM-SQLite-in-the-browser approach is a materially different problem than Electron's native Node.js main process.
Priority: Low — no current feature needs it; revisit once Phase 9 (Mobile) is scoped, or if a real offline-web request emerges.
Potential dependencies: `packages/local-client` (already built and now proven by `apps/desktop`).
Estimated value: True Local-First (Principle 2) compliance for the web product itself.

### Sync coverage for `ExecutionEvent` and `TaskExecutionSession`
Description: Extend the sync protocol (`services/sync`) to pull-cache `ExecutionEvent` rows and, separately, decide what cross-device semantics (if any) make sense for an in-progress `TaskExecutionSession`.
Reason: Descoped from Phase 5 to keep the entity registry uniformly bidirectional (3 entries, not a mixed shape); `ExecutionEvent` is already served online by `GET /goals/:goalId/activity`, and session timers are inherently server-driven with unclear cross-device meaning (does starting a task on one device end an open session on another?).
Priority: Low — no offline UI exists yet to consume either.
Potential dependencies: A concrete offline-UI feature that needs the activity timeline or active-session view while disconnected.
Estimated value: Full-fidelity offline experience once a real offline UI exists.

### Encrypt `packages/local-client`'s SQLite file at rest
Description: Add at-rest encryption (e.g. SQLCipher) to the local SQLite database file.
Reason: Currently plain-text on disk. Phase 8 shipped this exact file to `apps/desktop`'s `app.getPath('userData')` — the "before Phase 8" deadline this entry originally named has passed, and the risk is now live, not hypothetical: a lost/stolen device running `apps/desktop` exposes plain-text `Project`/`Goal`/`Task` data.
Priority: High — revisit before any real end-user distribution of `apps/desktop` (not blocking this session's implementation, which has no distribution yet).
Potential dependencies: An SQLCipher-compatible Prisma driver or adapter (needs research — not confirmed available today).
Estimated value: Protects offline data on lost/stolen devices.

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

### Extend `@pee/local-client`'s sync registry for offline execution/AI/analytics on desktop
Description: Cover `TaskExecutionSession`/`ExecutionEvent`/`AIRecommendation` (and a caching strategy for analytics) so `apps/desktop` has a fuller offline story beyond Project/Goal/Task CRUD.
Reason: Phase 8 deliberately kept desktop's offline scope identical to the existing sync registry rather than widening `@pee/local-client` mid-phase (that widening would itself be a form of "rewrite"). Execution start/complete, AI suggestions, and analytics are online-only passthroughs today — a real UX gap for a genuinely offline desktop session, but not one this phase's exit criteria required closing.
Priority: Medium — natural next step once `apps/desktop` has real users hitting the online-only gap.
Potential dependencies: Same cross-device-semantics questions the existing "Sync coverage for `ExecutionEvent` and `TaskExecutionSession`" backlog entry already raises.
Estimated value: A desktop session that works fully offline, not just for planning data.

### Dependency upgrade: Nest 11 / Next 16
Description: `npm audit` (2026-07-17) flags advisories in the NestJS 10.x/Express chain and Next.js 14.x that only clear via a major-version bump.
Reason: Deliberately not force-upgraded mid-Phase-1 to avoid pulling in untested majors without dedicated regression testing. See [20-known-issues.md](20-known-issues.md), [21-decision-log.md](21-decision-log.md).
Priority: Medium — no active exploit path identified for this app's usage, but should not sit indefinitely.
Potential dependencies: None blocking; standalone upgrade task.
Estimated value: Clears known CVEs, keeps the stack current.
