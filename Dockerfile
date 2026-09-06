# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# LYCEE.SIN — self-hosted image (Next.js 16 standalone + Postgres)
# Multi-stage build: deps → build → runtime.
# ─────────────────────────────────────────────────────────────

# 1. Install dependencies (cached unless the manifests change)
FROM node:22-alpine AS deps
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 2. Build the app
FROM node:22-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# next build emits .next/standalone thanks to output:"standalone".
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# A beacon must fail the image build, not just CI — CI can be skipped.
RUN node scripts/check-no-external-origins.mjs .next/static

# 3. Minimal runtime image
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Run as uid/gid 1000, which node:*-alpine already provides as the `node`
# user. NOT a custom 1001 user: this estate's appdata bind mounts are owned by
# the host's `nl` (1000), and the avatars directory is one of them. A 1001
# process cannot write a 1000-owned host directory, and a non-root process
# cannot chown its way out.
#
# The previous fix set `user: "1000:1000"` in compose while the image's files
# stayed owned by 1001. That let the app write avatars but left it unable to
# write its OWN .next tree, producing
#   Failed to update prerender cache … EACCES … _tree.segment.rsc
# on every dynamic route. Aligning the image with 1000 fixes both, and lets
# the compose override be removed.

# Standalone output: server + only the node_modules it actually needs.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Ship the DB migration + seed so the container can initialise the schema.
# (tsx is needed to run the TypeScript seed; installed globally, small.)
COPY --from=builder --chown=node:node /app/db ./db
COPY --from=builder --chown=node:node /app/lib ./lib
# tsx runs the TypeScript seed; pg is installed explicitly rather than relied
# on from Next's standalone output. The seed is invoked directly by tsx and is
# outside the traced dependency graph, so its resolution today is incidental —
# a refactor that drops the last app-side `pg` import would break the init
# container at seed time, far from the cause.
RUN npm install -g tsx pg

USER node
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
