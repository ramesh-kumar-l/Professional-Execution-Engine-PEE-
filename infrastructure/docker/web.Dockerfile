# apps/web (Next.js). Build from the repo root: docker build -f infrastructure/docker/web.Dockerfile .
#
# apps/web/lib/*-api-client.ts only import @pee/types as `import type` — those erase
# completely at compile time, so the Next.js standalone output (next.config.js:
# output: 'standalone') has zero runtime dependency on any workspace package. That's
# what makes this a plain single-app Docker image rather than a monorepo-aware one.

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Values only need to be well-formed for `next build`'s static analysis of auth.ts;
# real secrets are supplied at container run time via docker-compose/orchestrator env.
ENV NEXTAUTH_URL=http://localhost:3000 \
    NEXTAUTH_SECRET=build-time-placeholder \
    INTERNAL_API_URL=http://api:3001
RUN npm run build -w web

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
RUN addgroup -S pee && adduser -S pee -G pee
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
USER pee
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
