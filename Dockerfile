# syntax=docker/dockerfile:1

# FireOxine — three apps from one build.
#
#   apps/api    :3002  the only service with database access; also serves
#                      uploaded media from /uploads
#   apps/web    :3000  the storefront, an HTTP client of the API
#   apps/admin  :3001  the back office, an HTTP client of the API
#
# Pick one with `--target api|web|admin`, or let docker-compose build all three.
#
# The build does NOT touch a database. `prisma generate` only reads the schema,
# and no route executes at build time, so an image can be built without a
# Postgres to point at. Migrating and seeding are deploy-time steps, run once
# against the real database — see the Coolify section of the README.
#
# Note on prerendering: web and admin call the API inside generateStaticParams.
# During an image build the API is not running, so those calls fail softly and
# return no paths — the pages are then server-rendered on demand instead of
# prerendered. That is intentional; it is what lets the three images build
# independently and in any order.

# ----------------------------------------------------------------- deps
FROM node:22-alpine AS deps
# Prisma's engines are glibc-linked; alpine needs the compat shim and openssl.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
RUN npm ci

# ---------------------------------------------------------------- build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Both are build-time only. Prisma needs a syntactically valid URL to generate
# a client; it never connects. Each container gets real values at run time.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"

RUN npx prisma generate

RUN npm run build -w @fireoxine/api \
 && npm run build -w @fireoxine/web \
 && npm run build -w @fireoxine/admin

# ------------------------------------------------------------ runtime base
FROM node:22-alpine AS runtime
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# -------------------------------------------------------------------- api
FROM runtime AS api
# Standalone tracing keeps the workspace layout, so the server lives at
# apps/api/server.js with a shared node_modules beside it.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/api/.next/static ./apps/api/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/api/public ./apps/api/public
# The schema, migrations, seed and importer travel with the API image, because
# migrating and seeding are run as one-off commands inside this container.
COPY --from=builder --chown=nextjs:nodejs /repo/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/tsx ./node_modules/tsx
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.bin ./node_modules/.bin
USER nextjs
EXPOSE 3002
ENV PORT=3002
CMD ["node", "apps/api/server.js"]

# -------------------------------------------------------------------- web
FROM runtime AS web
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/web/.next/static ./apps/web/.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "apps/web/server.js"]

# ------------------------------------------------------------------ admin
FROM runtime AS admin
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/admin/.next/static ./apps/admin/.next/static
USER nextjs
EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/admin/server.js"]
