# API Design Standards

Cross-cutting conventions beyond what `claude/BACKEND.md` covers per-request. Source: `SYSTEM_PROMPT.md` §38.

## Conventions

- Resource-oriented, RESTful naming where appropriate; verbs only for actions that aren't resource CRUD.
- Every endpoint versioned (e.g. `/v1/...`); breaking changes get a new version, not a silent change (§51 backward compatibility).
- Idempotent operations where possible (safe retries).
- Pagination, filtering, and sorting supported consistently across list endpoints — same query-param shape everywhere.
- Structured, consistent error response shape across all services (see `templates/api-design-template.md`).
- Internal implementation details (DB column names, internal IDs not meant for clients) never leak into the public shape.

## Where the actual contract lives

Live endpoint documentation: `project-memory-bank/11-api-contract.md`. This file defines the *convention*; that file defines the *actual surface*.
