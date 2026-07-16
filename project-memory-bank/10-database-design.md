# 10 — Database Design

Source of truth for principles: `SYSTEM_PROMPT.md` §39 (`System_Prompt/Part3.md`). Concrete database technology: TBD, see [04-technology-stack.md](04-technology-stack.md).

## Governing principles (apply regardless of which database is chosen)

- The database is a source of truth — never optimize prematurely.
- Explicit schema.
- Versioned migrations — every schema change requires one.
- Foreign-key integrity.
- Transaction safety.
- Soft deletes where appropriate.
- Audit history.
- Optimistic locking where required.
- Documented indexes.

## Status

**TBD — no schema exists yet.** Will be populated once the database technology is chosen via ADR and Phase 0/1 entities are defined in a PRD ([02-prd.md](02-prd.md)).
