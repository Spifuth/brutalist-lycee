// @ts-nocheck
/**
 * LYCEE.SIN — Terminal gateway (reference implementation)
 * ------------------------------------------------------
 * Gives each student a disposable, resource-limited Docker container reachable
 * over a WebSocket. This service is intentionally kept OUT of the Next.js build
 * (see tsconfig "exclude"): run it separately on a host with a Docker daemon.
 *
 * Protocol (JSON messages) — must match the browser client:
 *   client -> server : { type: "hello", cols, rows }
 *                       { type: "input", data }
 *                       { type: "resize", cols, rows }
 *   server -> client : { type: "ready" }
 *                       { type: "output", data }
 *                       { type: "exit", code }
 *                       { type: "error", message }
 *
 * HTTP endpoints:
 *   GET /health    -> { status, uptime, sessions }
 *   GET /sessions  -> [{ id, startedAt, ... }]  (teacher monitoring)
 *
 * Security posture per container (see createContainer options below):
 *   - non-root user, read-only rootfs, all Linux caps dropped
 *   - no-new-privileges, no network
 *   - ~50MB disk quota, 256MB RAM, 0.5 CPU, PID cap
 *   - idle + max-session timeouts, AutoRemove on exit
 */

import http from "node:http"
import { WebSocketServer } from "ws"
import Docker from "dockerode"
import jwt from "jsonwebtoken"

const PORT = Number(process.env.PORT || 8080)
const IMAGE = process.env.CONTAINER_IMAGE || "alpine:3.20"
const JWT_SECRET = process.env.JWT_SECRET || "" // if set, students must present a valid token
const IDLE_TIMEOUT_MS = Number(process.env.IDLE_TIMEOUT_MS || 2 * 60 * 1000)
const MAX_SESSION_MS = Number(process.env.MAX_SESSION_MS || 10 * 60 * 1000)
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT || 50)

const docker = new Docker() // uses /var/run/docker.sock by default

/** @type {Map<string, { id: string, startedAt: number, container: any }>} */
const sessions = new Map()

// --------------------------------------------------------------------------
// HTTP server (health + monitoring) with WS upgrade
// --------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(JSON.stringify({ status: "ok", uptime: process.uptime(), sessions: sessions.size }))
    return
  }
  if (req.url === "/sessions") {
    res.writeHead(200, { "content-type": "application/json" })
    res.end(
      JSON.stringify(
        [...sessions.values()].map((s) => ({
          id: s.id,
          startedAt: s.startedAt,
          ageMs: Date.now() - s.startedAt,
        })),
      ),
    )
    return
  }
  res.writeHead(404)
  res.end("not found")
})

const wss = new WebSocketServer({ server, path: "/terminal" })

wss.on("connection", (ws, req) => {
  // Optional student JWT auth via ?token= or Authorization header.
  if (JWT_SECRET) {
    try {
      const url = new URL(req.url, "http://localhost")
      const token =
        url.searchParams.get("token") || (req.headers.authorization || "").replace(/^Bearer\s+/i, "")
      jwt.verify(token, JWT_SECRET)
    } catch {
      send(ws, { type: "error", message: "authentification requise" })
      ws.close()
      return
    }
  }

  if (sessions.size >= MAX_CONCURRENT) {
    send(ws, { type: "error", message: "capacite maximale atteinte, reessaie plus tard" })
    ws.close()
    return
  }

  handleSession(ws).catch((err) => {
    send(ws, { type: "error", message: String(err && err.message ? err.message : err) })
    ws.close()
  })
})

// --------------------------------------------------------------------------
// One student session = one container + one exec stream
// --------------------------------------------------------------------------

async function handleSession(ws) {
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  let container
  let stream
  let idleTimer
  let maxTimer

  const resetIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => teardown("timeout d'inactivite"), IDLE_TIMEOUT_MS)
  }

  const teardown = async (reason, code = 0) => {
    clearTimeout(idleTimer)
    clearTimeout(maxTimer)
    sessions.delete(sessionId)
    try {
      if (stream) stream.destroy()
      if (container) await container.remove({ force: true })
    } catch {
      /* ignore */
    }
    send(ws, { type: "exit", code, reason })
    try {
      ws.close()
    } catch {
      /* ignore */
    }
  }

  // Create a locked-down container.
  container = await docker.createContainer({
    Image: IMAGE,
    Cmd: ["/bin/sh"],
    Tty: true,
    OpenStdin: true,
    User: "1000:1000",
    WorkingDir: "/home/eleve",
    Env: ["HOME=/home/eleve", "PS1=eleve@sandbox:\\w$ "],
    HostConfig: {
      AutoRemove: true,
      NetworkMode: "none",
      ReadonlyRootfs: true,
      CapDrop: ["ALL"],
      SecurityOpt: ["no-new-privileges"],
      Memory: 256 * 1024 * 1024, // 256MB
      MemorySwap: 256 * 1024 * 1024, // no swap beyond RAM
      NanoCpus: 5 * 1e8, // 0.5 CPU
      PidsLimit: 64,
      // Writable scratch space with a ~50MB quota, everything else read-only.
      Tmpfs: { "/home/eleve": "rw,size=50m,uid=1000,gid=1000", "/tmp": "rw,size=10m" },
    },
  })

  sessions.set(sessionId, { id: sessionId, startedAt: Date.now(), container })

  await container.start()
  send(ws, { type: "ready" })

  // Attach an interactive exec.
  const exec = await container.exec({
    Cmd: ["/bin/sh"],
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  })
  stream = await exec.start({ hijack: true, stdin: true, Tty: true })

  stream.on("data", (chunk) => send(ws, { type: "output", data: chunk.toString("utf8") }))
  stream.on("end", () => teardown("session terminee"))

  resetIdle()
  maxTimer = setTimeout(() => teardown("duree maximale atteinte"), MAX_SESSION_MS)

  ws.on("message", (raw) => {
    let msg
    try {
      msg = JSON.parse(raw.toString())
    } catch {
      return
    }
    if (msg.type === "input") {
      resetIdle()
      stream.write(msg.data)
    } else if (msg.type === "resize") {
      exec.resize({ w: msg.cols, h: msg.rows }).catch(() => {})
    } else if (msg.type === "hello") {
      exec.resize({ w: msg.cols || 80, h: msg.rows || 24 }).catch(() => {})
    }
  })

  ws.on("close", () => teardown("client deconnecte"))
  ws.on("error", () => teardown("erreur socket"))
}

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj))
}

server.listen(PORT, () => {
  console.log(`[gateway] en ecoute sur :${PORT} (ws path /terminal)`)
  console.log(`[gateway] image=${IMAGE} auth=${JWT_SECRET ? "jwt" : "off"}`)
})
