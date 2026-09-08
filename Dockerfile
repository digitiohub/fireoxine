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
# The build seeds its own SQLite database rather than expecting one to be
# mounted, so a client can be handed one command and see the whole system. For
# production, point DATABASE_URL at Postgres and switch the datasource provider
# in prisma/schema.prisma — the bundled SQLite file is demo furniture.
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
ENV DATABASE_URL="file:./dev.db"
# Build-time only. Each container is given a real secret at run time.
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"

RUN npx prisma generate \
 && npx prisma db push --skip-generate \
 && npx tsx prisma/fetch-catalogue-images.ts || true
RUN npx tsx prisma/seed.ts

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
COPY --from=builder --chown=nextjs:nodejs /repo/prisma ./prisma
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
