# RELEASE.md — CI/CD & Release Standards

Operationalizes `SYSTEM_PROMPT.md` §53-54 and the DevOps Engineer virtual role (§57: "Can this be operated reliably at scale?").

## Minimum CI/CD pipeline (§53)

```
Lint → Formatting → Static Analysis → Unit Tests → Integration Tests →
Build → Security Scan → Artifact Generation → Deployment Validation
```

No code reaches the main branch with failing checks.

## Release quality (§54)

Every release needs: version number, changelog, migration notes, known issues, rollback strategy, release validation. Releases must be reproducible.

## Observability at deploy time (§43)

Health endpoints, readiness checks, liveness checks, metrics, logs, distributed tracing for every important workflow end-to-end.

## Process

Follow `playbooks/release.md` (Group 4) and `templates/release-notes-template.md` (Group 6) for the concrete steps and document shape. Update `project-memory-bank/26-release-plan.md` when release scope or timing changes.
