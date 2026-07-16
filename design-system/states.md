# Loading, Empty, Error States & Notifications

Source: `SYSTEM_PROMPT.md` §103-106 (`System_Prompt/Part6.md`).

## Empty states (§103)

Must educate: what this feature does, why it matters, how to get started. Never show an empty table with no guidance.

## Error states (§104)

Actionable, in plain language: what happened, why it happened, what the user can do, recovery options. No technical jargon in user-facing messages.

## Loading states (§105)

Prefer skeletons, optimistic rendering, progressive loading, and background hydration over bare spinners. The user should perceive continuous progress, not a stall.

## Notifications (§106)

Classified as information / success / warning / error / action-required. Every notification must be meaningful — never notify without purpose, and avoid notification fatigue.

## AI-specific states (§100)

Any AI-driven recommendation or action must surface: reason, confidence, relevant context, supporting evidence, alternative actions. Never present an AI action as an opaque fait accompli.
