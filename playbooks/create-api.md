# Playbook: Create API

Invoked by `/create-api`. Source: `SYSTEM_PROMPT.md` §38, §45 (`claude/BACKEND.md`, `claude/SECURITY.md`).

## Inputs

Endpoint purpose, resource(s) involved, consumer(s) (web/mobile/desktop/public API).

## Required memory bank

`11-api-contract.md`, `10-database-design.md`, `12-security.md`, the relevant service's module docs.

## Steps

1. Design the contract first: resource naming, HTTP verbs, versioning, pagination/filtering/sorting needs, request/response schema, error shape. Use `templates/api-design-template.md`.
2. Validate against `claude/BACKEND.md` API standards — RESTful conventions, idempotency where relevant, no leaked internals.
3. Apply security requirements: input validation, authN/authZ, rate limiting (`claude/SECURITY.md`).
4. Implement, keeping the handler/service/repository layers in separate files under ~300 lines each.
5. Write unit tests for business logic and integration/API tests for the endpoint itself.
6. Document the endpoint in `project-memory-bank/11-api-contract.md`.

## Outputs

Endpoint implementation, tests, updated API contract doc.

## Validation

Contract matches design; tests passing; security checklist (`checklists/security-checklist.md`) reviewed.

## Completion criteria

Task completion report; `11-api-contract.md` and `18-current-state.md` updated. Stop for approval.
