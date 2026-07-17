# 11 — API Contract

Source of truth for standards: `SYSTEM_PROMPT.md` §38 (`System_Prompt/Part3.md`). Standards live in `claude/BACKEND.md`; this file tracks the actual, current contract.

## Governing standards (apply to every endpoint once built)

RESTful where appropriate, predictable naming, versioned endpoints, idempotent operations where possible, pagination, filtering, sorting, validation, structured error responses. Never expose internal implementation details.

## Runtime

The API is served by the NestJS `api` module ([adr/0002](../adr/0002-backend-language-and-service-boundaries.md)); requests/responses are typed via `/packages/types`, shared with the Next.js frontend. Auth on protected routes is JWT-based, issued by the `auth` module ([adr/0005](../adr/0005-authentication-strategy.md)).

## Status

**Phase 2 endpoints live, 2026-07-18.**

## Current endpoints (`/services/auth`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/auth/register` | none | Rate-limited (5/min). 409 on duplicate email. |
| POST | `/auth/login` | none | Rate-limited (10/min). Returns `{ user, tokens }`. Records `LOGIN_SUCCESS`/`LOGIN_FAILURE`. |
| POST | `/auth/refresh` | refresh token (body) | Rotates the refresh token; 401 + revokes the whole chain on reuse of an already-rotated token. |
| POST | `/auth/logout` | refresh token (body) | 204, idempotent. |
| GET | `/auth/me` | access token (Bearer) | `JwtAuthGuard`-protected. |
| GET | `/health` | none | `services/api` liveness check. |

## Current endpoints (`/services/projects`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/projects` | access token (Bearer) | Creates a project owned by the caller. |
| GET | `/projects` | access token (Bearer) | Paginated (`?page=&pageSize=`, default 1/20, cap 100). `?status=ACTIVE\|ARCHIVED` (default `ACTIVE`), `?search=` (name, case-insensitive contains). |
| GET | `/projects/:id` | access token (Bearer) | 404 if missing **or** owned by another user — same response either way, to avoid leaking existence. |
| PATCH | `/projects/:id` | access token (Bearer) | Partial update (`name`/`description`/`status`); same 404 rule as above. |
| DELETE | `/projects/:id` | access token (Bearer) | Soft-delete (sets `status = ARCHIVED`), 204, idempotent. |

All `/projects` routes are `JwtAuthGuard`-protected — there are no anonymous project routes. Ownership is enforced in `ProjectsService`, not at the route level.

## Token custody (BFF pattern)

The browser never receives a raw access/refresh token. The Next.js server (Auth.js) calls the `/auth/*` endpoints server-to-server and holds tokens inside its own encrypted session; the same session's access token is attached as a Bearer header when the Next.js server calls `/projects/*` on the user's behalf. Only Auth.js's httpOnly session cookie reaches the browser. See [12-security.md](12-security.md) and `21-decision-log.md`.

Use [templates/api-design-template.md](../templates/README.md) for the next endpoint group (Phase 3+).
