# DOCUMENTATION.md — Documentation Standards

Operationalizes `SYSTEM_PROMPT.md` §28, §52 and the Technical Writer virtual role (§57: "Could a new engineer understand this tomorrow?").

## Every public component needs (§52)

Purpose · responsibilities · dependencies · usage · examples · limitations · configuration · failure modes. Documentation is part of the implementation, not an afterthought.

## Documentation-first (§28)

Before implementing a major feature: update the architecture doc, update the design, update interfaces — then implement. Documentation and implementation must stay synchronized; a feature isn't done if its docs lag behind the code (§49, §75).

## Where documentation lives

- **Product/architecture knowledge** → `project-memory-bank/` (see `claude/MEMORY.md`).
- **How to operate** → `claude/` (this folder).
- **Recurring workflows** → `playbooks/`.
- **Reusable document shapes** → `templates/`.
- **Major technical decisions** → `adr/`.
- **Cross-cutting standards not owned by a runtime doc** → `docs/standards/`.

Never duplicate the same knowledge across two of these — cross-reference instead.

## Comment discipline

Default to no comments in code. Add one only when the *why* is non-obvious (a hidden constraint, a workaround, a subtle invariant) — not to restate what well-named code already shows.
