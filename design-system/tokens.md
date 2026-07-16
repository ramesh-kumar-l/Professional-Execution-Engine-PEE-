# Design Tokens

Source: `SYSTEM_PROMPT.md` §91, §93 (`System_Prompt/Part6.md`). Concrete values are TBD — set on the first real frontend implementation task and recorded here; this file defines the *categories* every token set must cover.

## Categories to define

- **Typography** — type scale, font family (favor high readability, information-dense), weight scale, line-height.
- **Spacing** — a consistent spacing scale used everywhere; no ad hoc pixel values in components.
- **Color palette** — dark-mode-first, with light mode equally polished, not an afterthought. Semantic color roles (primary, danger, warning, success, info, muted) in addition to raw palette.
- **Icons** — one consistent icon set/style.
- **Elevation** — a small set of shadow/elevation levels, used sparingly (avoid decorative depth).
- **Corner radius** — a consistent radius scale.
- **Motion** — duration/easing scale; favor purposeful, subtle motion over gimmicky animation (§91).
- **Focus indicators** — a single, consistent, always-visible focus style token.

## Rule

No component may hardcode a spacing, color, or type value that isn't a token. When a new value is needed, add it to the relevant token category first — see `claude/FRONTEND.md`.

## Status

**TBD — actual token values not yet chosen.** This file becomes authoritative once the first frontend implementation task defines them; update `project-memory-bank/23-ui-design-system.md` to reflect the same.
