# ADR-0004: Infrastructure, Hosting, and CI/CD Baseline

- **Status:** Accepted
- **Date:** 2026-07-17
- **Phase:** 0.5 (Foundation — Architecture ADR)

## Problem

`04-technology-stack.md` lists infrastructure/hosting as TBD, reserving Docker, Kubernetes, and Terraform as candidates. Phase 1 needs a concrete, minimal deployment target — without one, "done" for any backend feature is undefined (nowhere to run it, no CI gate to pass).

## Context

- Backend is a single NestJS deployable (modular monolith, ADR-0002); no multi-service orchestration need exists yet.
- Principle 8 (Sustainable Complexity): adopt operational complexity only when justified.
- `/infrastructure` reserves `docker`, `kubernetes`, `terraform`, `github` (§36) as candidate subfolders, not commitments.
- `docs/standards/ci-cd.md` is currently TBD and depends on this decision.

## Options Considered

1. **Docker for packaging + docker-compose for local dev; a managed container platform (e.g., a single container service) for early production; Kubernetes deferred; Terraform introduced once more than one cloud resource type exists; GitHub Actions for CI/CD.**
2. **Kubernetes from day one.** Matches the long-term enterprise-deployment goal directly, but imposes cluster operations, manifests, and ongoing maintenance for a system with zero running services — disproportionate now.
3. **Fully serverless (functions-as-a-service) for the backend.** Removes container ops entirely, but conflicts with the modular-monolith/NestJS decision (ADR-0002) and with stateful local-first sync needs (ADR-0003); would force a rewrite of the backend shape already chosen.

## Decision

**Option 1.** Docker packages the NestJS app and Postgres for local development via `docker-compose`. Early production runs as a single containerized deployment on a managed container platform (exact provider is an operational choice made at first deploy, not an architectural one — any platform that runs a Docker image satisfies this ADR). Kubernetes is deferred until a specific, demonstrated need (multi-service scaling, need for independent module deployment per ADR-0002's extraction seam) arises. Terraform is introduced when cloud resources exist beyond "one container + one managed Postgres instance" (e.g., once there's more than a handful of resources worth versioning as code). GitHub Actions runs CI (lint, typecheck, test, build) on every PR, gating merges per `claude/RELEASE.md`.

## Trade-offs

Gained: fast path to a working deployment with minimal operational surface area; every heavier option (K8s, Terraform) remains available as a later ADR without contradicting this one. Given up: no auto-scaling, multi-region, or independent-service deployment until those tools are actually adopted — acceptable, since no current load requires them.

## Migration Impact

None yet — no infrastructure exists. This ADR defines what `/infrastructure/docker` and `.github/workflows` should contain once Phase 1 implementation starts; `/infrastructure/kubernetes` and `/infrastructure/terraform` stay empty placeholders until their triggering conditions above are met.

## Alternatives Rejected

Option 2 rejected per Principle 8 — Kubernetes complexity with no services to orchestrate is pure overhead. Option 3 rejected because it structurally conflicts with the already-decided backend shape (ADR-0002) and offline/local-first storage model (ADR-0003), which assume a persistent, stateful process rather than ephemeral functions.

## Memory Bank Reference

`project-memory-bank/04-technology-stack.md`, `03-system-architecture.md`, `docs/standards/ci-cd.md`.
