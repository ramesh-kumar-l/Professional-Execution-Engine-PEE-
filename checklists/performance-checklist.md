# Performance Checklist

Source: `SYSTEM_PROMPT.md` §44, §101, `project-memory-bank/25-performance-goals.md`.

- ☐ Measured against target, not assumed
- ☐ Initial load < 2s (frontend)
- ☐ Interaction latency < 100ms (frontend)
- ☐ Navigation latency < 150ms (frontend)
- ☐ Large lists virtualized
- ☐ Code splitting / route-based lazy loading applied
- ☐ Images optimized
- ☐ Bundle size monitored
- ☐ Database access efficient (no N+1, indexes documented)
- ☐ Network usage efficient
- ☐ Before/after numbers recorded (`playbooks/performance-review.md`)
