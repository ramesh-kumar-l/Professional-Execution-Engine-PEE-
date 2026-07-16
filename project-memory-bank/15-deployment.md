# 15 — Deployment

Standards live in `claude/RELEASE.md` (source: `SYSTEM_PROMPT.md` §53-54). This file tracks the *product-specific* deployment setup.

## Status

**TBD — no deployment pipeline or hosting target chosen yet.** Depends on infrastructure decisions in [04-technology-stack.md](04-technology-stack.md) and [03-system-architecture.md](03-system-architecture.md).

## What goes here once implemented

- Environments (local/CI/staging/production) and how each is provisioned
- Actual CI/CD pipeline configuration (link to `.github/` or equivalent once it exists)
- Deployment/rollback procedure — see `playbooks/release.md` (Group 4) for the step-by-step
- Current release cadence — see [26-release-plan.md](26-release-plan.md)
