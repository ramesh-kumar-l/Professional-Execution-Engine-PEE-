# 11 — API Contract

Source of truth for standards: `SYSTEM_PROMPT.md` §38 (`System_Prompt/Part3.md`). Standards live in `claude/BACKEND.md`; this file tracks the actual, current contract.

## Governing standards (apply to every endpoint once built)

RESTful where appropriate, predictable naming, versioned endpoints, idempotent operations where possible, pagination, filtering, sorting, validation, structured error responses. Never expose internal implementation details.

## Status

**TBD — no API exists yet.** This file becomes the live index of actual endpoints (or a pointer to generated OpenAPI/schema docs) once `/services/api` has real routes. Use [templates/api-design-template.md](../templates/README.md) (Group 6) when designing each new endpoint group.
