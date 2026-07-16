# Git, Branching & Release Standards

Source: `SYSTEM_PROMPT.md` §53-54. Release process detail: `playbooks/release.md`, `claude/RELEASE.md`.

## Git hygiene

- Commit messages explain *why*, not just *what* — the diff already shows what changed.
- No force-push to shared branches; no history rewriting on branches others may have pulled.
- No skipping hooks (`--no-verify`) or bypassing signing unless explicitly instructed.
- Prefer small, reviewable commits over large mixed-purpose ones (§25 task decomposition — avoid oversized commits).

## Branching

Feature work happens on branches, not directly on `main`. No code reaches `main` with failing CI checks (§53).

## Releases

Every release is versioned, reproducible, and carries a changelog, migration notes, known issues, and a confirmed rollback strategy (§54, `checklists/release-checklist.md`).
