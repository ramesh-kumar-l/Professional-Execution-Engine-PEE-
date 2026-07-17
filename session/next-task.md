# Next Task

Live draft — mirrors `project-memory-bank/29-next-task.md` at session end.

Phase 0, 0.5, 1 (Authentication), 2 (Projects), and 3 (Planning Engine) are complete. Next, ideally in an environment with Docker: generate and apply the first Prisma migration (none has ever been created), then run the Docker-dependent integration/e2e suites (`services/auth/test/auth.e2e-spec.ts`, `services/projects/test/projects.e2e-spec.ts`, `services/planning/test/planning.e2e-spec.ts`, `apps/web/e2e/login.spec.ts`, `apps/web/e2e/projects.spec.ts`, `apps/web/e2e/planning.spec.ts`) at least once — not executed in the authoring sandbox — then get user direction on Phase 4 (Execution Engine) scope.
