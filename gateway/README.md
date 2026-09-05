# Terminal gateway (reference implementation)

A small Node service that gives each student a **disposable, resource-limited
Docker container** reachable from the browser terminal over a WebSocket.

> This service is **not** part of the Next.js app and is excluded from its
> TypeScript build. Run it on a host with a Docker daemon.

## Why

The web app ships a safe in-browser sandbox by default. When you want students
to use a *real* shell, run this gateway and point the frontend at it with:

```
NEXT_PUBLIC_TERMINAL_WS_URL=ws://your-host:8080/terminal
```

## Run

```bash
cd gateway
cp .env.example .env      # adjust values
npm install
docker pull alpine:3.20   # or your CONTAINER_IMAGE
npm start
```

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

## Optional auth

Set `JWT_SECRET` to require a signed student token. The frontend then connects
with `?token=<jwt>` or an `Authorization: Bearer <jwt>` header. A real
deployment would issue these tokens from the main app after login.
