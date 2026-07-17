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

### Dependency upgrade: Nest 11 / Next 16
Description: `npm audit` (2026-07-17) flags advisories in the NestJS 10.x/Express chain and Next.js 14.x that only clear via a major-version bump.
Reason: Deliberately not force-upgraded mid-Phase-1 to avoid pulling in untested majors without dedicated regression testing. See [20-known-issues.md](20-known-issues.md), [21-decision-log.md](21-decision-log.md).
Priority: Medium — no active exploit path identified for this app's usage, but should not sit indefinitely.
Potential dependencies: None blocking; standalone upgrade task.
Estimated value: Clears known CVEs, keeps the stack current.
