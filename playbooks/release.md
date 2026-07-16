# Playbook: Release

Invoked by `/release`. Source: `SYSTEM_PROMPT.md` §53-54 (`claude/RELEASE.md`).

## Inputs

The set of changes to release (phase/epic/feature scope).

## Required memory bank

`26-release-plan.md`, `17-phase-status.md`, `20-known-issues.md`.

## Steps

1. Confirm the CI/CD pipeline passed in full: lint → format → static analysis → unit tests → integration tests → build → security scan → artifact generation → deployment validation (§53).
2. Assign a version number following the scheme in `26-release-plan.md`.
3. Write the changelog: what changed, migration notes, known issues, rollback strategy.
4. Validate the release is reproducible (build from a clean checkout).
5. Deploy per environment hierarchy (local → CI → staging → production).
6. Confirm health/readiness/liveness checks pass post-deploy.

## Outputs

Tagged release, changelog (`templates/release-notes-template.md`), updated `26-release-plan.md`.

## Validation

All pipeline stages green; rollback strategy confirmed viable before shipping to production.

## Completion criteria

Phase/task completion report referencing the release; `18-current-state.md` updated. Stop for approval before the next release cycle begins.
