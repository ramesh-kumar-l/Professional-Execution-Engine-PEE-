# ADR-0005: Authentication and Session Strategy

- **Status:** Accepted
- **Date:** 2026-07-17
- **Phase:** 0.5 (Foundation — Architecture ADR)

## Problem

`12-security.md` and `04-technology-stack.md` leave the auth provider TBD. Phase 1 is literally "Authentication" (`16-roadmap.md`) — it cannot be scoped without this decision.

## Context

- Principle 2 (Local First) and the enterprise/self-hosted deployment goal (§10) both push against a hard dependency on a third-party SaaS auth vendor that a self-hosted deployment couldn't run without.
- Backend is NestJS (ADR-0002); frontend is Next.js.
- Must scale from a single individual (simple email/password or passkey) to enterprise teams (SSO/SAML/OIDC) without a rewrite (§10).
- No compliance regime is currently identified (`12-security.md`), so no specific certification requirement constrains provider choice yet.

## Options Considered

1. **First-party auth service (NestJS module) + Auth.js (NextAuth) on the frontend, JWT-based sessions, OIDC-ready from day one.** We own the user/credential data model (fits Local-First/self-host), Auth.js gives a proven, well-maintained provider abstraction (email/password, OAuth social login, and OIDC/SAML enterprise SSO later) without locking the *data* into a third party.
2. **Third-party auth-as-a-service (e.g., a hosted identity SaaS).** Fastest initial integration, but user identity/session data would live outside our own database by default, in tension with Local-First/self-hosted deployment, and adds a hard external dependency an on-prem enterprise customer may not accept.
3. **Roll a fully custom auth stack (no library) on both ends.** Maximum control, but reimplements well-understood, security-critical primitives (password hashing, session/CSRF handling, OAuth/OIDC flows) that are exactly the kind of code most prone to subtle, high-severity bugs — rejected by the Engineering Excellence and Trust Before Automation principles' spirit of not reinventing solved, trust-critical problems.

## Decision

**Option 1.** Auth.js (NextAuth) on the Next.js frontend handles credential/OAuth login flows and issues sessions; the NestJS `auth` module (per ADR-0002's module boundary) is the system of record for users, credentials, and issues short-lived **JWTs** for API access plus refresh tokens for session renewal. The data model is designed for OIDC/SAML enterprise SSO to be added later (Phase 10, Enterprise) as additional Auth.js providers, not a rewrite. Passwords are hashed with a modern adaptive hash (argon2) if/when password auth is offered; OAuth social login is supported from the same module.

## Trade-offs

Gained: identity data stays in our own Postgres (ADR-0003), satisfying self-host/Local-First; a credible path to enterprise SSO without redesign; avoids reinventing security-critical primitives by using Auth.js rather than hand-rolled OAuth/OIDC. Given up: more integration work upfront than a hosted auth SaaS would require; we own security maintenance (dependency updates, session/token rotation policy) rather than delegating it to a vendor's SLA.

## Migration Impact

None yet — no auth code exists. Establishes the `auth` Nest module's responsibility (user/credential storage, JWT issuance, refresh rotation) and the frontend's responsibility (Auth.js session UI, provider config) as the binding shape for Phase 1.

## Alternatives Rejected

Option 2 rejected: identity-data residency outside our own store conflicts with Local-First and self-hosted enterprise deployment, and introduces an external dependency with no corresponding requirement to justify it yet. Option 3 rejected: hand-rolling credential storage, session handling, and OAuth/OIDC flows carries disproportionate security risk for a "Trust Before Automation" product with no offsetting benefit over a maintained library.

## Memory Bank Reference

`project-memory-bank/12-security.md`, `04-technology-stack.md`.
