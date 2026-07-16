# 25 — Performance Goals

Source of truth: `SYSTEM_PROMPT.md` §44 (general), §101 (frontend) — `System_Prompt/Part3.md`, `Part6.md`.

## Frontend targets (§101, concrete numbers already pinned)

- Initial load: **< 2 seconds**
- Interaction latency: **< 100 ms**
- Navigation latency: **< 150 ms**
- Virtualized large lists, incremental rendering, code splitting, route-based lazy loading, image optimization, bundle-size monitoring.

## Backend/general targets (§44 — no concrete numbers pinned yet)

Fast startup, low memory usage, low latency, efficient database access, efficient network usage, lazy loading where appropriate. Concrete SLOs are **TBD** — to be set once the backend stack ([04-technology-stack.md](04-technology-stack.md)) and first real service exist; measure, never assume performance.

Track live metrics against these targets in `dashboard/METRICS.md` (Group 11) once instrumentation exists.
