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

# ---------------------------------------------------------------- build
FROM node:22-slim AS builder
# Debian, not Alpine: Prisma ships glibc-linked query engines, and the musl
# shim is a source of failures that surface with nothing attached.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /repo

# Source first, then install. This used to be a separate `deps` stage whose
# node_modules was copied in, and that was silently wrong: npm does not hoist
# everything to the root in a workspace. `jose` installs at
# apps/api/node_modules/jose, so copying only /repo/node_modules dropped it and
# the API build failed with "Module not found: Can't resolve 'jose'".
#
# Installing in place is correct by construction — no bookkeeping about which
# workspace happens to have nested dependencies this week. It costs the
# dependency layer's cache when only source changes, which is a fair price for
# a build that cannot silently lose a package.
COPY . .

# --include=dev is not optional: Coolify (and most CI) exports
# NODE_ENV=production, and `npm ci` honours that by omitting devDependencies —
# which is where next, typescript and tailwind live.
RUN npm ci --include=dev

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are inlined into the JavaScript at build time, not read
# at run time. If this is absent here, the front ends ship with the localhost
# fallback compiled in and every product image 404s in production, however
# correct the runtime environment is.
ARG NEXT_PUBLIC_MEDIA_URL="http://localhost:3002"
ENV NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL

# NODE_ENV is deliberately NOT set here. `next build` selects production mode
# itself, and forcing the variable either way only risks a non-standard build.
# The npm side is handled above, with --include=dev on the install.
# Both are build-time only. Prisma needs a syntactically valid URL to generate
# a client; it never connects. Each container gets real values at run time.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
ENV AUTH_SECRET="build-time-placeholder-not-used-at-runtime"

RUN npx prisma generate

# The migrate/seed commands run inside the API container, so the Prisma CLI and
# tsx have to travel with it. They are installed into their own prefix rather
# than cherry-picked out of /repo/node_modules: the CLI has transitive
# dependencies of its own (`effect`, among others), and copying the packages
# by name drops them silently — the failure is a MODULE_NOT_FOUND at the moment
# you try to migrate a live database, which is the worst possible time to find
# out. Letting npm resolve the tree is the only way to get this right.
# bcryptjs is in here because the seed hashes the two starter passwords, and
# Next bundles it into the server chunks rather than leaving it in
# node_modules — so it is present for the running API and absent for a script.
RUN mkdir -p /tools && cd /tools && npm init -y >/dev/null \
 && npm install --omit=dev prisma@6.16.2 tsx@4.20.5 bcryptjs@3.0.2

# One RUN per app, so a failure names the app that failed. Combined, the only
# thing the log shows is that "the build" broke — which is what happened.
RUN echo "=== building api ===" && npm run build -w @fireoxine/api
RUN echo "=== building web ===" && npm run build -w @fireoxine/web
RUN echo "=== building admin ===" && npm run build -w @fireoxine/admin

# ------------------------------------------------------------ runtime base
FROM node:22-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
RUN groupadd -g 1001 nodejs && useradd -u 1001 -g nodejs -m -s /bin/bash nextjs

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

# The CLI tools merge INTO node_modules rather than sitting beside it. Node
# resolves a bare import from the importing file upwards, so a script at
# /app/prisma/seed.ts only ever looks in /app/node_modules — a sibling
# directory would be invisible to it however the PATH is set.
COPY --from=builder --chown=nextjs:nodejs /tools/node_modules ./node_modules

# Last, so it wins any overlap: the generated client and its query engine.
# Next's standalone tracing has a long history of missing the engine binary,
# and a server that cannot reach the database is not worth the megabytes saved
# by trusting it.
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma ./node_modules/@prisma

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
