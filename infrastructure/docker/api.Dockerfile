# services/api (NestJS composition root). Build from the repo root:
#   docker build -f infrastructure/docker/api.Dockerfile .
#
# Unlike apps/web, this one genuinely runs workspace code at runtime (NestJS DI needs
# the real @pee/* classes, not just types), so the runtime image keeps the monorepo's
# node_modules layout (npm workspaces = symlinks) intact rather than trying to flatten it.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/database/package.json packages/database/package.json
COPY packages/logging/package.json packages/logging/package.json
COPY packages/types/package.json packages/types/package.json
COPY services/ai/package.json services/ai/package.json
COPY services/analytics/package.json services/analytics/package.json
COPY services/api/package.json services/api/package.json
COPY services/auth/package.json services/auth/package.json
COPY services/execution/package.json services/execution/package.json
COPY services/organizations/package.json services/organizations/package.json
COPY services/planning/package.json services/planning/package.json
COPY services/projects/package.json services/projects/package.json
COPY services/sync/package.json services/sync/package.json
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages ./packages
COPY services ./services
COPY package.json package-lock.json ./
RUN npm run prisma:generate \
 && npm run build -w @pee/types \
 && npm run build -w @pee/database \
 && npm run build -w @pee/logging \
 && npm run build -w @pee/auth \
 && npm run build -w @pee/organizations \
 && npm run build -w @pee/projects \
 && npm run build -w @pee/planning \
 && npm run build -w @pee/execution \
 && npm run build -w @pee/sync \
 && npm run build -w @pee/ai \
 && npm run build -w @pee/analytics \
 && npm run build -w @pee/api \
 && npm prune --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3001
RUN addgroup -S pee && adduser -S pee -G pee
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/packages ./packages
COPY --from=build /app/services ./services
USER pee
EXPOSE 3001
CMD ["node", "services/api/dist/main.js"]
