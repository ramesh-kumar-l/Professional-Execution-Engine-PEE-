# Observability & Logging Standards

Source: `SYSTEM_PROMPT.md` §42-43. Product-specific tooling choices: `project-memory-bank/14-observability.md`.

## Logging

Structured logging (not plain text) wherever the runtime supports it. Every log entry should be able to answer: what happened, when, why, which component, which user, which request. Levels: TRACE, DEBUG, INFO, WARN, ERROR, FATAL — used consistently, not just INFO/ERROR everywhere.

## Observability

Every feature ships with: metrics, logs, distributed tracing, and health/readiness/liveness endpoints where it's a service. Every important workflow must be traceable end-to-end — a request should be followable across every service it touches via a shared correlation/trace ID.

## Human-facing summary

`dashboard/METRICS.md` (Group 11) surfaces the human-scannable version of what this file's raw instrumentation produces.
