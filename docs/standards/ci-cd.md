# CI/CD Standards

Source: `SYSTEM_PROMPT.md` §53.

## Minimum pipeline

```
Lint → Formatting → Static Analysis → Unit Tests → Integration Tests →
Build → Security Scan → Artifact Generation → Deployment Validation
```

No code reaches the main branch with failing checks — this is a hard gate, not a recommendation.

## Status

**Tool chosen (GitHub Actions, `adr/0004`); no pipeline configured yet** (no product code exists). Configure this pipeline as part of the first real Phase-1 implementation work, under `/infrastructure/github`, running lint/typecheck/test/build on every PR per the minimum pipeline above.
