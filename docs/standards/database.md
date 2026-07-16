# Database Standards

Cross-cutting conventions. Source: `SYSTEM_PROMPT.md` §39.

## Conventions

- Every schema change ships as a versioned, reversible migration — never a manual/ad hoc schema edit.
- Explicit schema everywhere; no implicit/inferred columns.
- Foreign-key integrity enforced at the database level, not just application level.
- Transactions used for any multi-step write that must be atomic.
- Soft deletes where audit/recovery matters; hard deletes only when justified and documented.
- Every non-trivial index is documented with the query pattern it serves — undocumented indexes are treated as technical debt (`project-memory-bank/27-backlog.md`).
- Optimistic locking used where concurrent writes to the same row are expected.

## Where the actual schema lives

Live schema documentation: `project-memory-bank/10-database-design.md`. This file defines the *convention*; that file defines the *actual schema* once one exists.
