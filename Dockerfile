# syntax=docker/dockerfile:1

# FireOxine — self-contained demo image.
#
# The build seeds its own SQLite database rather than expecting one to be
# mounted, for two reasons. First, `next build` is not a pure step here: several
# routes use generateStaticParams and query the catalogue at build time, so a
# database has to exist before the build can run at all. Second, the point of
# this image is that a client can be handed one command and see the whole site.
#
# For production, point DATABASE_URL at Postgres and switch the datasource
# provider in prisma/schema.prisma to postgresql — the bundled SQLite file is
# demo furniture, exactly like the placeholder artwork.

# ----------------------------------------------------------------- deps
FROM node:22-alpine AS deps
# Prisma's engines are glibc-linked; alpine needs the compat shim and openssl.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------- build
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="file:/app/prisma/dev.db"

# AUTH_SECRET is scoped to this one RUN rather than set with ENV: an ENV would
# be baked into the image layers, and even a throwaway value flagged there
# trains people to ignore the warning that matters. The real secret is supplied
# at run time; this only has to exist so the auth config imports cleanly.
RUN AUTH_SECRET="build-only-never-used-at-runtime" sh -c '\
      npx prisma generate \
   && npx prisma db push --skip-generate \
   && npx tsx prisma/seed.ts \
   && npx tsx prisma/attach-placeholders.ts \
   && npm run build'

# ---------------------------------------------------------------- runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL="file:/app/prisma/dev.db"

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Standalone bundle, plus the two things tracing does not pick up: the static
# chunks and the public directory.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# The seeded catalogue, and the Prisma client and query engine, which the
# standalone trace does not follow because the client is generated.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Admin uploads land here. Mount a volume over it to keep them across restarts;
# without one they live only as long as the container.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
VOLUME ["/app/public/uploads"]

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
