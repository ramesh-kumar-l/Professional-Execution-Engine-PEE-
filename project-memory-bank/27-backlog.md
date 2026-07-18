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

### AI-assisted plan generation
Description: Given a goal, have an AI provider suggest a decomposed task list.
Reason: Requires the `AIProvider` abstraction, which doesn't exist until Phase 6 (AI Integration).
Priority: Medium.
Potential dependencies: Phase 6's `AIProvider` interface (`adr/0006`).
Estimated value: Reduces manual planning effort significantly.

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
Reason: `apps/web` is 100% server-rendered (Server Components + Server Actions, BFF pattern) with zero client-side data fetching today; Phase 5 deliberately built the sync protocol and a reusable SQLite reference client (`packages/local-client`) without rewriting the web app's rendering architecture — that's squarely Phase 8 (Desktop) and Phase 9 (Mobile)'s job, where a native/embedded SQLite binding fits naturally.
Priority: Low — no current feature needs it; revisit when Phase 8/9 scoping begins.
Potential dependencies: `packages/local-client` (already built, ready to be consumed).
Estimated value: True Local-First (Principle 2) compliance for the web product itself.

### Sync coverage for `ExecutionEvent` and `TaskExecutionSession`
Description: Extend the sync protocol (`services/sync`) to pull-cache `ExecutionEvent` rows and, separately, decide what cross-device semantics (if any) make sense for an in-progress `TaskExecutionSession`.
Reason: Descoped from Phase 5 to keep the entity registry uniformly bidirectional (3 entries, not a mixed shape); `ExecutionEvent` is already served online by `GET /goals/:goalId/activity`, and session timers are inherently server-driven with unclear cross-device meaning (does starting a task on one device end an open session on another?).
Priority: Low — no offline UI exists yet to consume either.
Potential dependencies: A concrete offline-UI feature that needs the activity timeline or active-session view while disconnected.
Estimated value: Full-fidelity offline experience once a real offline UI exists.

### Encrypt `packages/local-client`'s SQLite file at rest
Description: Add at-rest encryption (e.g. SQLCipher) to the local SQLite database file.
Reason: Currently plain-text on disk; acceptable for a backend-only reference client with no shipped end-user surface yet, but a real gap once Phase 8 (Desktop) ships this file to end-user machines, where device loss/theft is a realistic threat model.
Priority: Medium — revisit before, not during, Phase 8.
Potential dependencies: An SQLCipher-compatible Prisma driver or adapter (needs research — not confirmed available today).
Estimated value: Protects offline data on lost/stolen devices.

### Multi-device conflict resolution beyond simple last-write-wins
Description: Handle more than two concurrent writers to the same row more richly than "whoever's wall clock is newer wins" (e.g. field-level merge, user-facing conflict resolution UI).
Reason: Phase 5's LWW-by-timestamp is proportional to the current single-device-at-a-time usage pattern (Sustainable Complexity); a genuine multi-device power user editing the same row from two devices within the same minute is an edge case with no reported need yet.
Priority: Low.
Potential dependencies: Telemetry showing real conflict frequency, to justify the added complexity.
Estimated value: Fewer surprised "my edit disappeared" moments for genuinely concurrent multi-device users.

### Dependency upgrade: Nest 11 / Next 16
Description: `npm audit` (2026-07-17) flags advisories in the NestJS 10.x/Express chain and Next.js 14.x that only clear via a major-version bump.
Reason: Deliberately not force-upgraded mid-Phase-1 to avoid pulling in untested majors without dedicated regression testing. See [20-known-issues.md](20-known-issues.md), [21-decision-log.md](21-decision-log.md).
Priority: Medium — no active exploit path identified for this app's usage, but should not sit indefinitely.
Potential dependencies: None blocking; standalone upgrade task.
Estimated value: Clears known CVEs, keeps the stack current.
