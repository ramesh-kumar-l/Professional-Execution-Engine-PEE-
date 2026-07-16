# Accessibility & Dark/Light Mode

Source: `SYSTEM_PROMPT.md` §91, §97 (`System_Prompt/Part6.md`). Executable checklist: `checklists/accessibility-checklist.md`.

## Accessibility (mandatory, §97)

Keyboard navigation, screen-reader support, high contrast, reduced motion, visible focus indicators, semantic HTML, appropriate ARIA usage. Validated during implementation, not bolted on after.

## Theming (§91)

Dark mode is the primary design target; light mode must be equally polished, not a lesser afterthought. Every token in `design-system/tokens.md` needs both a dark and light value. Theme switching must not cause layout shift or loss of state.
