# adr/ — Architecture Decision Records

Records of major technical decisions: problem, options, decision, trade-offs, migration impact, alternatives rejected (`SYSTEM_PROMPT.md` §27).

**When to load:** when a current task touches an area with a prior ADR, or before proposing a decision that might duplicate/contradict one.

**When to update:** a new ADR is added for every major architectural decision. Existing ADRs are never rewritten — superseding decisions get a new ADR that references the old one and updates its status.

## Contents

- `0000-template.md` — the ADR template.
- `0001-adopt-engineering-operating-system.md` — seed record documenting the EOS bootstrap itself.
- Subsequent ADRs numbered sequentially.

Cross-references: every ADR should have a corresponding one-line entry in `project-memory-bank/21-decision-log.md`.
