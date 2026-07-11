# Orchestra web — containerised for local test. Runs `next start` (no next.config change).
# Monorepo build: pnpm workspace, contracts transpiled by Next.
# NEXT_PUBLIC_* are baked at build (client needs them); SUPABASE_SERVICE_ROLE_KEY is runtime-only.

FROM node:22-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --no-frozen-lockfile
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @orchestra/web build

FROM node:22-slim AS run
RUN corepack enable
WORKDIR /app
COPY --from=build /app /app
WORKDIR /app/apps/web
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000
CMD ["pnpm", "start", "-p", "3000"]
