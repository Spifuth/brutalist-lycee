# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# LYCEE.SIN terminal gateway — standalone Node WebSocket service.
# Single stage on purpose: no build step, no toolchain to carry. This image
# only proxies WebSocket sessions to disposable containers created through
# socket-proxy-lycee (see docker-compose service `brutalist-gateway`, which
# stays behind `profiles: ["gateway"]` until deliberately enabled).
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

# package-lock.json is committed for exactly this: a reproducible,
# dev-dependency-free install.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./

# node:22-alpine already ships a non-root "node" user (uid/gid 1000) —
# no need to create one.
USER node

EXPOSE 8080

CMD ["node", "server.js"]
