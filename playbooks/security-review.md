# Playbook: Security Review

Invoked by `/security-review`. Source: `SYSTEM_PROMPT.md` §45, §57 Security Engineer role (`claude/SECURITY.md`).

## Inputs

The feature/endpoint/module under review, especially anything touching auth, user data, or external input.

## Required memory bank

`12-security.md`, `11-api-contract.md`, `checklists/security-checklist.md`.

## Steps

1. Ask, for every input surface: "what could be abused?" (§57).
2. Verify: input validation, output encoding, authentication, authorization, rate limiting, audit logging, secure defaults, secret handling, encryption in transit/at rest where required (`claude/SECURITY.md`).
3. Check dependency additions for known vulnerabilities (`claude/BACKEND.md` §46).
4. Confirm no sensitive data appears in logs or error messages (§41).
5. Walk through `checklists/security-checklist.md` explicitly, item by item.

## Outputs

List of findings (if any) with severity, and fixes applied or explicitly deferred with justification in `20-known-issues.md`.

## Validation

Checklist fully walked; no unresolved high-severity finding left undocumented.

## Completion criteria

Security review summary added to the relevant task/phase completion report. Stop for approval before merging if any finding required a design change.
