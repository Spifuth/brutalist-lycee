# Terminal gateway (reference implementation)

A small Node service that gives each student a **disposable, resource-limited
Docker container** reachable from the browser terminal over a WebSocket.

> This service is **not** part of the Next.js app and is excluded from its
> TypeScript build. Run it on a host with a Docker daemon reachable through
> `socket-proxy-lycee` (see "Docker access" below) — never with the socket
> mounted directly into this container.

## Why

The web app ships a safe in-browser sandbox by default. When you want students
to use a *real* shell, run this gateway and point the frontend at it with:

```
NEXT_PUBLIC_TERMINAL_WS_URL=ws://your-host:8080/terminal
```

## Run

```bash
cd gateway
cp .env.example .env      # adjust values — DOCKER_HOST and JWT_SECRET are required
npm install
docker pull alpine:3.20   # or your CONTAINER_IMAGE
npm start
```

The gateway **refuses to start** (non-zero exit, message on stderr) if either
`JWT_SECRET` or `DOCKER_HOST` is missing or malformed. There is no dev-mode
fallback for either.

## Docker access

This gateway never mounts `/var/run/docker.sock`. It talks to Docker only
through a dedicated socket proxy, `socket-proxy-lycee`, over `DOCKER_HOST`
(form `tcp://host:port`, e.g. `tcp://10.0.0.2:2375`). Constructing the
Docker client any other way (e.g. the `dockerode` default of "no options",
which reaches for the local socket) would silently defeat the whole point of
running a proxy in front of the daemon.

## Security model

Each session runs in its own container created with:

- **non-root** user (`1000:1000`)
- **read-only rootfs** with a small writable tmpfs (`/home/eleve`, ~50MB quota)
- **all Linux capabilities dropped** (`CapDrop: ALL`)
- **`no-new-privileges`**
- **no network** (`NetworkMode: none`)
- **256MB RAM**, no extra swap
- **0.5 CPU** (`NanoCpus`)
- **PID limit** (64)
- **idle timeout** and **max session duration**
- **`AutoRemove`** on exit — nothing persists between sessions
- **`MAX_CONCURRENT=15`**, sized for one classroom (15 × 256MB ≈ 3.84GB
  worst-case RAM), not an arbitrary cap

### The honest security position

`socket-proxy-lycee` narrows the Docker API surface this gateway can reach —
it blocks `/build`, `/images`, `/volumes`, `/networks`, `/secrets`, `/configs`,
`/exec`, `/system`, `/swarm`, and the socket file is never present in this
container at all.

**It does not, and cannot, make container creation safe by itself.** The
gateway must call `POST /containers/create`, and there is no finer-grained
`ALLOW_CREATE` toggle on the proxy image: creating containers requires
`POST=1`, and combined with `CONTAINERS=1` that admits **every** write verb
under `/containers` — including a create with `HostConfig.Binds: ["/:/host"]`
and `Privileged: true`, which is root on the host. Anything that can reach
this proxy unauthenticated can do that.

**The JWT gate below is therefore the load-bearing control, not the proxy.**
The proxy is defence in depth on top of it, not a substitute for it. There is
no unauthenticated mode: the gateway exits at startup if `JWT_SECRET` is
unset, precisely so this can't be forgotten in production.

## Protocol

WebSocket JSON messages (must match `components/terminal/terminal-playground.tsx`):

| Direction        | Message                               |
| ---------------- | ------------------------------------- |
| client → server  | `{ type: "hello", cols, rows }`       |
| client → server  | `{ type: "input", data }`             |
| client → server  | `{ type: "resize", cols, rows }`      |
| server → client  | `{ type: "ready" }`                   |
| server → client  | `{ type: "output", data }`            |
| server → client  | `{ type: "exit", code }`              |
| server → client  | `{ type: "error", message }`          |

## Monitoring (for the teacher)

- `GET /health` → `{ status, uptime, sessions }`
- `GET /sessions` → list of active sessions with age

## Auth (mandatory)

`JWT_SECRET` is required — there is no unauthenticated mode. Every WebSocket
connection must present a valid signed JWT via `?token=<jwt>` or an
`Authorization: Bearer <jwt>` header; the gateway verifies it before creating
a container. A real deployment issues these tokens from the main app after
login (a short-lived Server Action token, `sub` = user id) using the same
secret as `JWT_SECRET` here.
