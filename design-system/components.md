# Component Inventory, Forms, Tables, Command Palette

Source: `SYSTEM_PROMPT.md` §93-94, §98 (`System_Prompt/Part6.md`). Live inventory: `project-memory-bank/24-component-library.md` — this file defines the *rules*, that file tracks what actually exists.

## Component hierarchy (§94)

```
Tokens → Primitives → Components → Patterns → Templates → Screens → Workflows
```

Build reusable primitives before pages. No business logic embedded directly in presentation components.

## Forms

Validation errors are actionable and inline (see `design-system/states.md` for error-state rules). Every form must be fully keyboard-operable.

## Tables

Must support the information density this product favors (§91) while remaining scannable — clear visual hierarchy between primary data and metadata. Large tables require virtualization (`claude/FRONTEND.md` performance targets).

## Command palette (§98)

A first-class, global entry point for search and actions — not a bolt-on. Required for the keyboard-first experience.

## Rule

Never build a one-off component when an existing primitive or pattern already covers the need (§93). Check `project-memory-bank/24-component-library.md` before creating anything new.

## Status

**TBD — no components built yet.**
