import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { connectSse, CONNECTING, CLOSED, type EventSourceLike } from "../lib/sse-client.ts"

/**
 * A stand-in for the browser's EventSource, so these tests can drive the two
 * failure modes that actually happened in the room on 2026-09-09 without a
 * browser: a stream the browser abandons, and a stream that stays open and
 * stops saying anything.
 */
class FakeSource implements EventSourceLike {
  readyState = CONNECTING
  closed = false
  onerror: ((event?: unknown) => void) | null = null
  url: string
  private listeners = new Map<string, (event: { data: string }) => void>()

  constructor(url: string) {
    this.url = url
  }

  addEventListener(type: string, listener: (event: { data: string }) => void) {
    this.listeners.set(type, listener)
  }

  close() {
    this.closed = true
    this.readyState = CLOSED
  }

  /** The server delivered a frame. */
  emit(type: string, data: string) {
    this.readyState = 1
    this.listeners.get(type)?.({ data })
  }

  /** The browser reported a failure, and says whether it will retry itself. */
  fail(readyState: number) {
    this.readyState = readyState
    this.onerror?.()
  }
}

/** Deterministic stand-in for setTimeout: nothing fires until we say so. */
function fakeTimers() {
  let next = 1
  const pending = new Map<number, { fn: () => void; ms: number }>()
  return {
    setTimer(fn: () => void, ms: number) {
      const id = next++
      pending.set(id, { fn, ms })
      return id
    },
    clearTimer(handle: unknown) {
      pending.delete(handle as number)
    },
    /** Fires every timer currently armed for exactly `ms`. */
    fire(ms: number) {
      for (const [id, t] of [...pending]) {
        if (t.ms !== ms) continue
        pending.delete(id)
        t.fn()
      }
    },
    delays() {
      return [...pending.values()].map((t) => t.ms)
    },
    count() {
      return pending.size
    },
  }
}

function harness(overrides: Record<string, unknown> = {}) {
  const opened: FakeSource[] = []
  const timers = fakeTimers()
  const frames: string[] = []
  const status: boolean[] = []
  const connection = connectSse("/api/pixelwar/stream", {
    on: { full: (data) => frames.push(data) },
    onStatus: (connected) => status.push(connected),
    silenceMs: 20_000,
    minDelayMs: 1_000,
    maxDelayMs: 8_000,
    create: (url) => {
      const s = new FakeSource(url)
      opened.push(s)
      return s
    },
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
    ...overrides,
  })
  return { opened, timers, frames, status, connection, last: () => opened[opened.length - 1] }
}

test("reopens the stream after the browser gives up on it", () => {
  // The bug, exactly. A non-200 response (Traefik's 502 while brutalist-web
  // restarts) makes the browser *fail the connection* per the HTML spec:
  // readyState goes to CLOSED and it never retries. Every canvas open at that
  // moment sat on "hors ligne" until the student reloaded the page — and a
  // recreate, the operator's instinctive fix, is what caused it.
  const h = harness()
  assert.equal(h.opened.length, 1)

  h.last().fail(CLOSED)

  assert.equal(h.timers.delays().includes(1_000), true, "no reconnect was scheduled")
  h.timers.fire(1_000)
  assert.equal(h.opened.length, 2, "the browser abandoned the stream and nothing reopened it")
})

test("does not open a second stream while the browser is still retrying", () => {
  // A transient network error leaves readyState at CONNECTING: the browser
  // will reconnect on its own. Opening our own source here would leave two
  // live streams per page, which is how a well-meaning reconnect fix turns
  // one classroom into double the connections.
  const h = harness()

  h.last().fail(CONNECTING)

  assert.equal(h.opened.length, 1, "opened a duplicate stream while the browser was retrying")
  assert.equal(h.timers.delays().includes(1_000), false, "scheduled a redundant reconnect")
})

test("reopens a stream that goes silent without ever reporting an error", () => {
  // The failure actually observed at 14:02:33: the stream simply stopped, no
  // error was reported, and no reconnect request ever reached Traefik while
  // the same page kept placing pixels. Both routes push a frame every second,
  // so silence is not a quiet period — it is a dead stream.
  const h = harness()
  h.last().emit("full", "{}")

  h.timers.fire(20_000)

  assert.equal(h.last().closed, true, "the silent stream was left open")
  h.timers.fire(1_000)
  assert.equal(h.opened.length, 2, "a stream that went silent was never reopened")
})

test("backoff grows, is capped, and resets once frames arrive again", () => {
  // A server that is down stays down for minutes; retrying every second for
  // thirty students is a small stampede aimed at something already failing.
  const h = harness()
  const delays: number[] = []
  for (let i = 0; i < 5; i++) {
    h.last().fail(CLOSED)
    const scheduled = h.timers.delays()
    delays.push(scheduled[scheduled.length - 1])
    h.timers.fire(scheduled[scheduled.length - 1])
  }
  assert.deepEqual(delays, [1_000, 2_000, 4_000, 8_000, 8_000], "backoff did not grow and cap")

  h.last().emit("full", "{}")
  h.last().fail(CLOSED)
  assert.equal(
    h.timers.delays().includes(1_000),
    true,
    "backoff stayed wide after the stream recovered",
  )
})

test("close() cancels a pending reconnect and never opens another stream", () => {
  // React runs effect cleanup on unmount and on every re-run. A retry that
  // survives cleanup is a stream nobody owns, still holding a connection.
  const h = harness()
  h.last().fail(CLOSED)

  h.connection.close()

  assert.equal(h.timers.count(), 0, "a timer survived close()")
  h.timers.fire(1_000)
  assert.equal(h.opened.length, 1, "close() did not stop the reconnect loop")
  assert.equal(h.opened[0].closed, true, "close() left the underlying source open")
})

test("status follows the stream, and frames reach their handler", () => {
  const h = harness()
  h.last().emit("full", '{"pixels":[]}')
  assert.deepEqual(h.frames, ['{"pixels":[]}'])
  assert.deepEqual(h.status, [true])

  h.last().fail(CLOSED)
  assert.deepEqual(h.status, [true, false], "the badge did not fall back to offline")
})

test("no component subscribes with a bare EventSource", () => {
  // The whole point of lib/sse-client is that `new EventSource(...)` on its
  // own is not a working subscription: it dies for good on a non-200 and it
  // cannot notice a stream that goes silent. Four components learned that the
  // hard way on 2026-09-08/09; this fails if a fifth reintroduces it.
  const r = spawnSync(
    "git",
    ["grep", "-n", "new EventSource", "--", "app", "components", "lib"],
    { encoding: "utf8" },
  )
  const offenders = r.stdout
    .split("\n")
    .filter(Boolean)
    .filter((line) => !line.startsWith("lib/sse-client.ts:"))
  assert.deepEqual(
    offenders,
    [],
    `subscribe through connectSse() instead:\n${offenders.join("\n")}`,
  )
})
