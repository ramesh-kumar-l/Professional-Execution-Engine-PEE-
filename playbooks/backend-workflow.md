# Playbook: Backend Workflow

Invoked by `/backend-workflow`. Source: `SYSTEM_PROMPT.md` §36-46 (`claude/BACKEND.md`).

## Inputs

Backend feature, service, or module to build.

## Required memory bank

`08-backend-guidelines.md`, `03-system-architecture.md`, `10-database-design.md`, `11-api-contract.md`.

## Steps

1. Identify which service under `/services` this belongs to (or whether a new one is justified — new services are not created casually; check `03-system-architecture.md`).
2. Design the module's public interface, dependencies, and data model before writing implementation code.
3. Implement following `claude/BACKEND.md`: explicit schema/migrations for any DB change, structured error handling, no hardcoded config, dependency justified per §46.
4. Keep files under ~300 lines, split by responsibility (e.g. `service.py`, `repository.py`, `handlers.py` rather than one file).
5. Add logging, metrics, and health-check coverage for the new code path (`claude/BACKEND.md`, `project-memory-bank/14-observability.md`).
6. Write unit + integration tests per the testing pyramid.

## Outputs

Implemented module/service code, migrations if applicable, tests.

## Validation

Definition of done (`claude/BACKEND.md`): implemented, tested, documented, architecture-consistent, logged, metriced, errors handled, performance reviewed, security reviewed, memory bank updated.

## Completion criteria

Task completion report; `08-backend-guidelines.md` and/or `11-api-contract.md` updated if the service surface changed. Stop for approval.
