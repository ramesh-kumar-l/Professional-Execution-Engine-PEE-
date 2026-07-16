# SECURITY.md — Security Standards

Operationalizes `SYSTEM_PROMPT.md` §45 and the Security Engineer virtual role (§57: "What could be abused?").

## Mandatory requirements

Input validation · output encoding · authentication · authorization · rate limiting · audit logging · secure defaults · secret management · dependency scanning · encryption in transit · encryption at rest where required.

**Never trust client input.**

## Applies everywhere

- Every API endpoint: validate and authorize before acting (§38, §45).
- Every dependency addition: is it actively maintained and secure before it's justified at all (§46)?
- Every config value that is secret: environment variables, never committed to source (§40).
- Every error path: no sensitive information leaks into logs or user-facing messages (§41).

## Review gate

Security is part of "definition of done" (§49) and of the phase completion report (§81 "security review"). A feature touching authentication, authorization, user data, or external input is not complete without an explicit security pass.

Full executable checklist: `checklists/security-checklist.md` (Group 7).
