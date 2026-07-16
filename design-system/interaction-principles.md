# Interaction Principles & Dashboard Patterns

Source: `SYSTEM_PROMPT.md` §90, §92, §99, §102, §109 (`System_Prompt/Part6.md`).

## Core interaction principles (§90)

- **Clarity** — users always know where they are, what they're working on, what changed, what needs attention, what happens next.
- **Focus** — every visible element has a purpose; prefer progressive disclosure over crowded screens.
- **Speed** — the interface should feel instantaneous (optimistic updates, skeleton loading, incremental rendering, virtualization, lazy loading, background sync).
- **Trust** — never surprise the user; every AI action is inspectable (§100).
- **Consistency** — navigation, spacing, typography, icons, animation, interaction, color, and terminology stay consistent everywhere.

## Visual hierarchy (§102)

Each screen clearly distinguishes: primary action, secondary action, current work, upcoming work, background information, warnings, errors, AI recommendations. The most important information requires the least effort to find.

## AI-native UX (§99)

AI augments, never dominates: it suggests, summarizes, prioritizes, plans, explains, recommends. The user stays in control — never replace a core workflow with an opaque AI interaction.

## Dashboard patterns

Dashboards apply the same visual-hierarchy rule at a higher level: surface what needs attention first, background information last. Concrete dashboard layout is defined once the first dashboard screen is implemented — TBD; see `dashboard/` (this repo's own project-tracking dashboard) for the pattern this product's own dashboards should ultimately resemble in spirit (clarity over decoration).

## Final principle (§109)

The interface should make complex execution feel simple. Every design decision should reduce friction, increase confidence, and reinforce trust.
