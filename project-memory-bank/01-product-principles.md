# 01 — Product Principles

Source of truth: `SYSTEM_PROMPT.md` §4-5, §8, §11 (`System_Prompt/Part1.md`).

## The eight immutable principles (§5)

1. **Execution First** — execution matters more than information.
2. **Local First** — local storage, local indexing, offline support, privacy-first; cloud enhances, never replaces.
3. **AI Native** — intelligence is foundational, not a bolted-on feature.
4. **Human Control** — AI recommends, the human decides; the user retains final authority over significant actions.
5. **Incremental Intelligence** — every interaction should improve the system's understanding of the user, while respecting privacy.
6. **Trust Before Automation** — every recommendation must be explainable, traceable, reversible.
7. **Engineering Excellence** — readable code over clever code; understandable by engineers unfamiliar with the project.
8. **Sustainable Complexity** — complexity grows only when justified; prefer simple, composable components.

## Product quality bar (§8)

Never build prototypes. Never generate placeholder architecture or fake implementations. Never leave TODOs where production code is expected. Every implementation is production quality unless explicitly instructed otherwise.

## Primary objective (§11)

The objective is not to complete tasks — it's to build a trustworthy execution platform. When speed and long-term quality trade off against each other, choose long-term quality.

## Feature test (§4)

Every feature must answer "does this improve execution?" — if no, it doesn't exist.

Full decision framework applied per-feature: [05-development-contract.md](05-development-contract.md).
