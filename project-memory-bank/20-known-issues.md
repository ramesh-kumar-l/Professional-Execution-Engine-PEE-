# 20 — Known Issues / Risk Register

Source of truth for process: `SYSTEM_PROMPT.md` §82 (`System_Prompt/Part5.md`).

## Open risks

| Risk | Type | Impact | Mitigation |
|---|---|---|---|
| Backend/database/infrastructure stack undecided | Technical / Schedule | Blocks any real Phase 1+ implementation | Resolve via ADR at the start of Phase 0 product work, before writing service code |
| SYSTEM_PROMPT.md's example repo layout (§36) and memory-bank file list (§17) are illustrative, not exhaustive | Architectural | Could cause drift if followed too literally once real structure is chosen | Treat as example; record actual structure decisions as ADRs, update [03-system-architecture.md](03-system-architecture.md) |

No known issues currently — this repo has no product code yet, so no runtime defects exist. Add entries here as soon as they're discovered; never leave a known risk undocumented.
