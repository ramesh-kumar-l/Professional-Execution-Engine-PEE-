# playbooks/ — Engineering Workflow Procedures

Step-by-step procedures for recurring engineering workflows: inputs, outputs, required memory-bank files, implementation steps, validation, completion criteria (`SYSTEM_PROMPT.md` §62).

**When to load:** when starting a task of the matching type (e.g. load `implement-feature.md` before implementing a feature).

**When to update:** when the actual workflow used deviates from what's documented, or a new recurring workflow emerges.

## Contents

`implement-feature.md`, `fix-bug.md`, `create-api.md`, `refactor-module.md`, `performance-review.md`, `security-review.md`, `release.md`, `frontend-workflow.md`, `backend-workflow.md`.

Cross-references: each playbook is mirrored as a live slash-command in `.claude/commands/` — the command file is a thin pointer, this file is the source of truth. Checklists referenced by a playbook's "Validation" step live in `checklists/`.
