# Backend Checklist

Source: `SYSTEM_PROMPT.md` §36-46, `claude/BACKEND.md`.

- ☐ Clear public interface, minimal dependencies
- ☐ Explicit schema + versioned migration for any DB change
- ☐ Structured, actionable error handling — no silent failures
- ☐ Configuration via env vars, no hardcoded values, no committed secrets
- ☐ API follows conventions: versioned, paginated, validated, structured errors
- ☐ Logging answers what/when/why/which-component/which-user/which-request
- ☐ Metrics and health/readiness/liveness checks added
- ☐ Files under ~300 lines, split by responsibility
- ☐ New dependency justified (maintained, secure, low transitive cost)
