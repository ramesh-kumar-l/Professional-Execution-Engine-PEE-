# CI/CD Standards

Source: `SYSTEM_PROMPT.md` §53.

## Minimum pipeline

```
Lint → Formatting → Static Analysis → Unit Tests → Integration Tests →
Build → Security Scan → Artifact Generation → Deployment Validation
```

No code reaches the main branch with failing checks — this is a hard gate, not a recommendation.

## Status

**TBD — no CI/CD pipeline configured yet** (no product code exists). Configure this pipeline as part of the first real Phase-0/Phase-1 implementation work, under `/infrastructure/github` (or equivalent) per `project-memory-bank/03-system-architecture.md`. Record the concrete tool choice (GitHub Actions, etc.) in `project-memory-bank/04-technology-stack.md`.
