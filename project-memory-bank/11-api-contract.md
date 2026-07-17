# 11 — API Contract

Source of truth for standards: `SYSTEM_PROMPT.md` §38 (`System_Prompt/Part3.md`). Standards live in `claude/BACKEND.md`; this file tracks the actual, current contract.

## Governing standards (apply to every endpoint once built)

RESTful where appropriate, predictable naming, versioned endpoints, idempotent operations where possible, pagination, filtering, sorting, validation, structured error responses. Never expose internal implementation details.

## Runtime

The API is served by the NestJS `api` module ([adr/0002](../adr/0002-backend-language-and-service-boundaries.md)); requests/responses are typed via `/packages/types`, shared with the Next.js frontend. Auth on protected routes is JWT-based, issued by the `auth` module ([adr/0005](../adr/0005-authentication-strategy.md)).

## Status

**Phase 1 endpoints live, 2026-07-17.**

## Current endpoints (`/services/auth`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | none | Rate-limited (5/min). 409 on duplicate email. |
| POST | `/auth/login` | none | Rate-limited (10/min). Returns `{ user, tokens }`. Records `LOGIN_SUCCESS`/`LOGIN_FAILURE`. |
| POST | `/auth/refresh` | refresh token (body) | Rotates the refresh token; 401 + revokes the whole chain on reuse of an already-rotated token. |
| POST | `/auth/logout` | refresh token (body) | 204, idempotent. |
| GET | `/auth/me` | access token (Bearer) | `JwtAuthGuard`-protected. |
| GET | `/health` | none | `services/api` liveness check. |

## Token custody (BFF pattern)

The browser never receives a raw access/refresh token. The Next.js server (Auth.js) calls these endpoints server-to-server and holds tokens inside its own encrypted session; only Auth.js's httpOnly session cookie reaches the browser. See [12-security.md](12-security.md) and `21-decision-log.md` (2026-07-17 entries).

Use [templates/api-design-template.md](../templates/README.md) for the next endpoint group (Phase 2+).
