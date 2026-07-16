# Playbook: Frontend Workflow

Invoked by `/frontend-workflow`. Source: `SYSTEM_PROMPT.md` §108 (`claude/FRONTEND.md`, `design-system/`).

## Inputs

UI feature or screen to build.

## Required memory bank

`23-ui-design-system.md`, `24-component-library.md`, `07-frontend-guidelines.md`, `design-system/` full spec.

## Steps

1. Review the design-system documentation and the existing component inventory (`24-component-library.md`) before designing anything new.
2. Produce a user flow and component hierarchy (Tokens → Primitives → Components → Patterns → Templates → Screens → Workflows).
3. If a dedicated frontend-design capability is available, use it to iterate on layout/interaction before coding.
4. Implement using existing reusable primitives and design tokens; only add a new primitive if no existing one fits, and register it in `24-component-library.md`.
5. Validate against `claude/FRONTEND.md`'s Design Review Checklist: spacing, responsiveness, accessibility, keyboard nav, theme compatibility, loading/error/empty states, visual hierarchy, performance targets.
6. Update `design-system/` and `24-component-library.md` if a new reusable pattern was introduced.

## Outputs

Implemented UI, tests, updated component inventory if applicable.

## Validation

`checklists/frontend-checklist.md` fully walked; performance targets (`25-performance-goals.md`) met.

## Completion criteria

Task completion report; design-system/component-library updated if changed. Stop for approval.
