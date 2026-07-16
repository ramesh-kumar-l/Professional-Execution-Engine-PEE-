# Layout, Navigation & Responsive Rules

Source: `SYSTEM_PROMPT.md` §91, §96, §98 (`System_Prompt/Part6.md`).

## Layout

Information-dense, highly readable, professional — resembling modern engineering tools (Linear, Raycast, Notion, GitHub, VS Code, Figma, Cursor) rather than consumer social apps, without copying them (§92). A grid system and page-shell layout are defined once the first screen is implemented — TBD.

## Navigation

Must remain consistent across the entire application (§90) — same patterns for primary nav, breadcrumbs, and contextual actions everywhere. Concrete nav structure is product-specific — see `project-memory-bank/07-frontend-guidelines.md` once populated.

## Responsive rules (§96)

Support desktop, laptop, tablet, large tablet, and mobile from the beginning. No desktop-only workflows are acceptable, even in early phases.

## Keyboard-first (§98)

Every primary workflow should be reachable via: command palette, global search, keyboard shortcuts, quick navigation, context actions, multi-select, bulk actions. The mouse must remain optional, not required, for core workflows.

## Status

**TBD — no screens implemented yet.** Concrete grid, breakpoints, and nav structure are defined on first frontend implementation.
