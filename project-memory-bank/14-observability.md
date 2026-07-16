# 14 — Observability

Source of truth: `SYSTEM_PROMPT.md` §42-43 (`System_Prompt/Part3.md`).

## Governing standards

Logging must answer: what happened, when, why, which component, which user, which request. Required levels: TRACE/DEBUG/INFO/WARN/ERROR/FATAL, structured (not plain text) where possible. Every feature must be observable: metrics, logs, distributed tracing, health/readiness/liveness endpoints. Every important workflow must be traceable end-to-end.

## Status

**TBD — no logging/metrics/tracing stack chosen yet.** Depends on infrastructure decisions in [04-technology-stack.md](04-technology-stack.md).

## What goes here once implemented

Chosen logging/metrics/tracing stack, dashboard locations, alerting thresholds, and links to `dashboard/METRICS.md` for the human-facing summary.
