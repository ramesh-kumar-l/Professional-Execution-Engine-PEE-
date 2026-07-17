# 11 — API Contract

Source of truth for standards: `SYSTEM_PROMPT.md` §38 (`System_Prompt/Part3.md`). Standards live in `claude/BACKEND.md`; this file tracks the actual, current contract.

## Governing standards (apply to every endpoint once built)

RESTful where appropriate, predictable naming, versioned endpoints, idempotent operations where possible, pagination, filtering, sorting, validation, structured error responses. Never expose internal implementation details.

## Runtime

The API is served by the NestJS `api` module ([adr/0002](../adr/0002-backend-language-and-service-boundaries.md)); requests/responses are typed via `/packages/types`, shared with the Next.js frontend. Auth on protected routes is JWT-based, issued by the `auth` module ([adr/0005](../adr/0005-authentication-strategy.md)).

## Status

**Phase 3 endpoints live, 2026-07-18.**

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

## Current endpoints (`/services/planning`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/projects/:projectId/goals` | access token (Bearer) | Creates a goal under a project; 404 if the project isn't owned by the caller. |
| GET | `/projects/:projectId/goals` | access token (Bearer) | Paginated. `?status=NOT_STARTED\|IN_PROGRESS\|COMPLETED\|ARCHIVED` (default: everything except `ARCHIVED`), `?search=` (title, case-insensitive contains). |
| GET | `/goals/:id` | access token (Bearer) | Returns the goal with a computed `progress: { totalTasks, doneTasks, percentComplete }`. 404 if missing or not owned. |
| PATCH | `/goals/:id` | access token (Bearer) | Partial update (`title`/`description`/`targetDate`/`status`); same 404 rule. |
| DELETE | `/goals/:id` | access token (Bearer) | Soft-delete (`status = ARCHIVED`), 204, idempotent. |
| POST | `/goals/:goalId/tasks` | access token (Bearer) | Creates a task under a goal; 404 if the goal isn't owned by the caller. |
| GET | `/goals/:goalId/tasks` | access token (Bearer) | Paginated, ordered by `order` then `createdAt`. `?status=TODO\|IN_PROGRESS\|DONE\|ARCHIVED` (default: everything except `ARCHIVED`). |
| GET | `/tasks/:id` | access token (Bearer) | 404 if missing or not owned. |
| PATCH | `/tasks/:id` | access token (Bearer) | Partial update (`title`/`description`/`status`/`order`); a `status` change triggers the parent goal's progress recalculation. |
| DELETE | `/tasks/:id` | access token (Bearer) | Soft-delete (`status = ARCHIVED`), 204, idempotent; also triggers the parent goal's progress recalculation. |

All `/goals/*` and `/tasks/*` routes are `JwtAuthGuard`-protected. **Closed-loop behavior:** every task mutation that can change status counts (create, status update, archive) recalculates the parent goal's `status` and `progress` — a client never has to call a separate "recompute" endpoint; reading a goal always reflects current task state.

## Token custody (BFF pattern)

The browser never receives a raw access/refresh token. The Next.js server (Auth.js) calls the `/auth/*` endpoints server-to-server and holds tokens inside its own encrypted session; the same session's access token is attached as a Bearer header when the Next.js server calls `/projects/*` on the user's behalf. Only Auth.js's httpOnly session cookie reaches the browser. See [12-security.md](12-security.md) and `21-decision-log.md`.

Use [templates/api-design-template.md](../templates/README.md) for the next endpoint group (Phase 3+).
