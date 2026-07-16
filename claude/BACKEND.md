# BACKEND.md — Backend Engineering

Operationalizes `SYSTEM_PROMPT.md` §36-46 and the Senior Backend Engineer / Principal Architect virtual roles (§57).

## Repository organization (§36)

```
/apps            web, desktop, mobile
/services        api, auth, memory, execution, planning, analytics, notifications
/packages        sdk, ui, design-system, shared, config, types, utils
/infrastructure  docker, kubernetes, terraform, github
/docs
/project-memory-bank
/tests
/scripts
/tools
```

Avoid deep nesting. Prefer clear boundaries between modules. Backend/DB/infra language choices are TBD — see `project-memory-bank/04-technology-stack.md` and the Phase-0 ADR that will resolve them.

## Module design (§37)

Every module exposes: a clear public interface, minimal dependencies, independent tests, documentation, configuration, metrics, logging. Modules should be independently replaceable.

## File size — strict modularity

Keep implementation files under ~300 lines. A file that grows past that gets split by responsibility (e.g. a monolithic `services.py` becomes `calendar_service.py`, `goal_service.py`, ...) rather than left to grow. This is a hard convention for this repo: it lets a future session load only the ~100-300 line file relevant to its task instead of consuming tokens reading an oversized file.

## API design standards (§38)

RESTful where appropriate, predictable naming, versioned endpoints, idempotent operations where possible, pagination, filtering, sorting, validation, structured error responses. Never expose internal implementation details.

## Database principles (§39)

The database is a source of truth — never optimize prematurely. Explicit schema, versioned migrations, foreign-key integrity, transaction safety, soft deletes where appropriate, audit history, optimistic locking where required, documented indexes. Every schema change requires a migration.

## Configuration (§40)

Never hardcode configuration. Support local/CI/staging/production. Hierarchy: environment variables → configuration files → defaults. Secrets never committed to source control.

## Error handling (§41)

Errors are expected, not exceptional. Every error must be logged, traceable, carry context, preserve stack information, produce an actionable message, and never leak sensitive information. Never silently swallow exceptions.

## Dependency management (§46)

Before adding a dependency: can this be implemented internally with reasonable effort? Is it actively maintained, secure, low on transitive dependencies, and does it keep build complexity low? Prefer fewer, higher-quality dependencies.

## Definition of done (§49)

Code implemented · tests passing · docs updated · architecture consistent · logs added · metrics added · errors handled · performance reviewed · security reviewed · memory bank updated. Missing any item means the task isn't done.
