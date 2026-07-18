# 15 — Deployment

Standards live in `claude/RELEASE.md` (source: `SYSTEM_PROMPT.md` §53-54). This file tracks the *product-specific* deployment setup.

## Status

**Implemented (2026-07-19, P0 hardening).** Per [adr/0004](../adr/0004-infrastructure-and-hosting.md): Docker images for `services/api` and `apps/web`, `docker-compose` for local dev (existing, Postgres-only) and a single-host reference compose for early production. Kubernetes/Terraform remain deferred until their triggering conditions in adr/0004 are met.

**Honest caveat:** the Dockerfiles and compose file below were written and reasoned through carefully (multi-stage builds verified against a real `next build --output=standalone` run and a real `prisma migrate diff`-generated schema), but the actual `docker build`/`docker run` round-trip has **not** been executed — no Docker daemon is available in the sandbox this work was done in. Treat this the same as this project's other environment-gated gaps (Detox-on-device, live-IdP browser login): verify the image build once in an environment with Docker before depending on it for a real deployment.

## Images

| Image | Dockerfile | Notes |
|---|---|---|
| `services/api` | `infrastructure/docker/api.Dockerfile` | Multi-stage; runtime stage keeps the npm-workspaces `node_modules` layout intact (NestJS DI needs the real `@pee/*` classes at runtime, not just types) |
| `apps/web` | `infrastructure/docker/web.Dockerfile` | Multi-stage using Next.js `output: 'standalone'` ([next.config.js](../apps/web/next.config.js)); every `@pee/types` import in `apps/web/lib` is `import type`, so it erases at compile time — the standalone bundle has **zero** runtime workspace dependency, confirmed by inspecting a real build's `.next/standalone/node_modules` (no `@pee/*` present) |

Both are built from the **repo root** as the Docker context, since npm workspaces require the root `package.json`/`package-lock.json`:

```bash
docker build -f infrastructure/docker/api.Dockerfile -t pee-api .
docker build -f infrastructure/docker/web.Dockerfile -t pee-web .
```

## Environments

- **Local dev:** `docker compose -f infrastructure/docker/docker-compose.dev.yml up` (Postgres only) + `npm run start:dev` per service, as today.
- **CI:** `.github/workflows/ci.yml` — Postgres service container, `prisma migrate deploy`, full test/build matrix. Unchanged by this work except that `packages/database/prisma/migrations/` now actually contains the initial migration (previously empty, so `migrate deploy` was a silent no-op and every e2e suite ran against a schema-less database — see [20-known-issues.md](20-known-issues.md)).
- **Early production:** `infrastructure/docker/docker-compose.prod.yml` — one Postgres + one `api` + one `web` container, matching adr/0004's "single containerized deployment" decision. Exact hosting platform (Fly.io, Railway, a single VM, ECS, etc.) is an operational choice at first deploy, not an architectural one.

## Deploy / rollback procedure

1. **Migrate first, separately from starting the app** (never run `prisma migrate deploy` from every replica's entrypoint — races on concurrent DDL):
   ```bash
   docker run --rm --env-file .env pee-api npx prisma migrate deploy --schema packages/database/prisma/schema.prisma
   ```
2. **Start/replace the app containers**: `docker compose -f infrastructure/docker/docker-compose.prod.yml up -d`.
3. **Verify readiness**: `curl -f http://<host>:3001/health` must return `{"status":"ok","database":"ok"}` (a real Prisma `SELECT 1`, not a hardcoded response — see [health.controller.ts](../services/api/src/health.controller.ts)). A `503` means the app container is up but the database isn't reachable; do not route traffic to it.
4. **Rollback**: re-deploy the previous image tag; migrations in this project are additive-only so far (no destructive schema changes shipped), so no down-migration step has been needed yet — this will need revisiting the first time a migration removes or renames a column.
5. Every container in `docker-compose.prod.yml` runs as a non-root user (`pee`) and honors `SIGTERM` — `services/api`'s `main.ts` calls `app.enableShutdownHooks()`, which drains in-flight requests and disconnects Prisma cleanly instead of dropping connections mid-query.

## Required environment

See [.env.example](../.env.example) for the full, current list (kept in sync with this doc — do not duplicate the values here). `services/api` validates all of it at boot via a Joi schema ([env.validation.ts](../services/api/src/env.validation.ts)) and refuses to start with a clear error if anything required is missing or malformed, rather than failing confusingly on the first request that touches the missing config.

## What's still not here

- No CD pipeline (image build + push + deploy) wired into `.github/workflows/ci.yml` yet — CI builds and tests the image ingredients but doesn't publish an image. That's a reasonable next step once a hosting target is actually chosen.
- No blue/green or canary rollout — a plain replace is what `docker-compose.prod.yml` gives you.
- Kubernetes/Terraform: still deferred per adr/0004, revisit only when multi-service scaling or more than a handful of cloud resources actually exist.
