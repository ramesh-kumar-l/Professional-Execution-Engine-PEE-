# FRONTEND.md — Frontend Engineering

Operationalizes `SYSTEM_PROMPT.md` §89-109 (full design contract) and the Senior Frontend Engineer / UX Designer virtual roles (§57).

## Stack (§95)

React, TypeScript, Next.js, Tailwind CSS, a component library built from reusable primitives. State management stays simple and predictable; prefer server-driven data; avoid unnecessary global state.

## Before building any UI feature (§108)

1. Review `design-system/` (full spec) and `project-memory-bank/23-ui-design-system.md` / `24-component-library.md`.
2. Review existing reusable components before creating new ones.
3. Produce a user flow and component hierarchy before implementation.
4. Implement using reusable primitives and design tokens — never one-off components when a primitive exists (§93).
5. Validate responsiveness, accessibility, and performance.
6. If a new reusable pattern is introduced, update `design-system/` and the memory-bank pointers.

Never build isolated pages that bypass the shared design language.

## Component hierarchy (§94)

```
Tokens → Primitives → Components → Patterns → Templates → Screens → Workflows
```

No business logic embedded directly in presentation components.

## Non-negotiable qualities (§90-92)

Clarity, focus, speed (optimistic updates, skeletons, virtualization, lazy loading), trust (every AI action inspectable, §100 explainable AI: reason/confidence/context/evidence/alternatives), consistency (nav, spacing, type, icons, motion, color, terminology). Professional/minimal/information-dense/keyboard-friendly; dark mode first, light mode equally polished. No decorative design, no gimmicky animation.

## Hard requirements

- Responsive across desktop/laptop/tablet/mobile from the start (§96) — no desktop-only workflows.
- Accessibility mandatory: keyboard nav, screen readers, high contrast, reduced motion, visible focus, semantic HTML, ARIA (§97).
- Keyboard-first: command palette, global search, shortcuts, quick nav, multi-select, bulk actions — mouse optional for most workflows (§98).
- Performance targets (§101): initial load < 2s, interaction latency < 100ms, navigation latency < 150ms. Virtualize large lists, code-split, lazy-load routes, optimize images, monitor bundle size.
- Empty states educate (what/why/how to start) — never an empty table with no guidance (§103).
- Errors are actionable (what happened / why / what to do / recovery) in plain language (§104).
- Loading states prefer skeletons/optimistic rendering over spinners (§105).
- Notifications are classified (info/success/warning/error/action-required) and never sent without purpose (§106).

## Design Review Checklist (§107)

Before accepting any UI implementation: consistent spacing, responsive layout, accessible interactions, keyboard navigation, theme compatibility, loading/error/empty states, visual hierarchy, performance targets met, component reuse, design-system compliance. Full checklist: `checklists/frontend-checklist.md` (Group 7).

## File size

Keep component/hook/util files small and single-purpose (target well under 300 lines) — split by responsibility rather than growing a file. This keeps future sessions able to load only the file they need.
