# 20 — Known Issues / Risk Register

Source of truth for process: `SYSTEM_PROMPT.md` §82 (`System_Prompt/Part5.md`).

## Open risks

| Risk | Type | Impact | Mitigation |
|---|---|---|---|
| Local SQLite ↔ Postgres sync protocol not yet designed | Technical | Blocks real offline behavior (Local-First, Principle 2) | Design when first feature needs it (Memory Engine, Phase 5, or earlier); schema already sync-ready per `adr/0003` (UUID PKs, `updated_at`/version columns) |
| SYSTEM_PROMPT.md's example repo layout (§36) and memory-bank file list (§17) are illustrative, not exhaustive | Architectural | Could cause drift if followed too literally once real structure is chosen | Treat as example; record actual structure decisions as ADRs, update [03-system-architecture.md](03-system-architecture.md) |

No known issues currently — this repo has no product code yet, so no runtime defects exist. Add entries here as soon as they're discovered; never leave a known risk undocumented.
