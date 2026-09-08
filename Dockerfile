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

# --include=dev is not optional here. Coolify (and most CI) exports
# NODE_ENV=production for the build, and `npm ci` honours that by omitting
# devDependencies — which is where next, typescript and tailwind live. The
# install then succeeds and the BUILD fails several minutes later with no
# indication why. Pinning it makes the stage mean what it says.
RUN npm ci --include=dev

# ---------------------------------------------------------------- build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are inlined into the JavaScript at build time, not read
# at run time. If this is absent here, the front ends ship with the localhost
# fallback compiled in and every product image 404s in production, however
# correct the runtime environment is.
ARG NEXT_PUBLIC_MEDIA_URL="http://localhost:3002"
ENV NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL

# NODE_ENV is deliberately NOT set here. `next build` selects production mode
# itself, and forcing the variable either way only risks a non-standard build.
# The npm side is handled where it matters, with --include=dev in deps.
# Three Next builds in one image on a small VPS is the usual place to run out
# of heap. The default cap is a fraction of the box; this states it plainly.
ENV NODE_OPTIONS=--max-old-space-size=3072
# Both are build-time only. Prisma needs a syntactically valid URL to generate
# a client; it never connects. Each container gets real values at run time.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"

RUN npx prisma generate

# One RUN per app, so a failure names the app that failed. Combined, the only
# thing the log shows is that "the build" broke — which is what happened.
RUN echo "=== building api ===" && npm run build -w @fireoxine/api
RUN echo "=== building web ===" && npm run build -w @fireoxine/web
RUN echo "=== building admin ===" && npm run build -w @fireoxine/admin

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
