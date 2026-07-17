# 12 — Security

Standards live in `claude/SECURITY.md` (source: `SYSTEM_PROMPT.md` §45). This file tracks the *product-specific* security posture.

## Status

**Auth strategy decided ([adr/0005](../adr/0005-authentication-strategy.md)); no auth/authorization model implemented yet.** The `auth` NestJS module is the system of record for users/credentials; Auth.js (NextAuth) drives frontend login; sessions are JWT + refresh-token based; enterprise SSO (OIDC/SAML) is an additive provider planned for Phase 10, not a redesign. Password hashing (when password auth is offered) uses argon2. See [04-technology-stack.md](04-technology-stack.md).

## What goes here once implemented

- Chosen authentication mechanism and provider
- Authorization model (roles/permissions) actually implemented
- Secret management approach in use (which vault/env strategy)
- Any compliance requirements adopted (none identified yet)
- Links to security review outcomes per completed phase (§81 phase completion report)

Do not duplicate the general security requirements checklist here — it lives in `claude/SECURITY.md` and `checklists/security-checklist.md`.
