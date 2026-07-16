# Playbook: Performance Review

Invoked by `/performance-review`. Source: `SYSTEM_PROMPT.md` §44, §101 (`claude/BACKEND.md`, `claude/FRONTEND.md`).

## Inputs

The feature, module, or page to review; any existing performance complaint or metric.

## Required memory bank

`25-performance-goals.md`, `14-observability.md`, `dashboard/METRICS.md` (once populated).

## Steps

1. Measure current performance against the relevant target in `25-performance-goals.md` — never assume, always measure (§44).
2. Identify bottlenecks using profiling/tracing appropriate to the layer (backend: query/N+1/serialization; frontend: bundle size, render count, virtualization gaps).
3. Propose the smallest change that closes the gap — avoid speculative optimization of paths that aren't measured to be slow.
4. Implement and re-measure to confirm improvement.
5. Record the before/after numbers.

## Outputs

Performance fix (or a documented decision that current performance is acceptable) with before/after measurements.

## Validation

Target met, or gap explicitly documented in `20-known-issues.md` with a mitigation plan if not yet achievable.

## Completion criteria

Task completion report with measurements. Stop for approval.
