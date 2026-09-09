/**
 * A Server-Sent Events subscription that actually comes back.
 *
 * `EventSource` has a reconnect built in, and every consumer in this codebase
 * relied on it. It is not enough, for two reasons measured on 2026-09-09:
 *
 * 1. **A non-200 response is fatal, not retried.** The HTML spec says that if
 *    the response status is not 200, or its `Content-Type` is not
 *    `text/event-stream`, the user agent must *fail the connection*: fire one
 *    `error`, set `readyState` to CLOSED, and stop. Traefik answers `502 Bad
 *    Gateway` as `text/plain` whenever the container is restarting — so every
 *    deploy permanently disconnected every page that was open, and the status
 *    badge sat on "hors ligne" until the student reloaded. ==The restart was
 *    the failure, not the fix.==
 * 2. **A stream can die without reporting anything.** On 2026-09-09 at
 *    14:02:33 a canvas that had been streaming happily for 16 minutes went
 *    quiet, no error was raised, and no reconnect request ever reached Traefik
 *    — while that same page went on placing pixels successfully. Nothing in a
 *    readyState-only recovery notices that.
 *
 * So this supervises the connection instead of trusting it: it reopens what
 * the browser abandoned, and it treats silence as death. Both stream routes
 * push a frame every second (`setPoller(..., 1000)`), so more than a few
 * seconds without one means the stream is gone whatever the browser believes.
 *
 * Everything the browser provides is injectable, because the failure modes
 * this exists to fix cannot be reproduced in `node --test` otherwise.
 */

/** `EventSource.CONNECTING`. Spelled out so this module never touches the DOM global. */
export const CONNECTING = 0
/** `EventSource.OPEN`. */
export const OPEN = 1
/** `EventSource.CLOSED` — the browser has given up and will not retry. */
export const CLOSED = 2

/** The slice of `EventSource` used here, so tests can supply their own. */
export interface EventSourceLike {
  readonly readyState: number
  onerror: ((event?: unknown) => void) | null
  addEventListener(type: string, listener: (event: { data: string }) => void): void
  close(): void
}

export interface ConnectOptions {
  /**
   * Frame handlers by event name. Use `message` for unnamed frames — that is
   * what `/api/live/stream` sends; `/api/pixelwar/stream` names its events.
   */
  on: Record<string, (data: string) => void>
  /** Called with `true` on every frame and `false` on every failure. */
  onStatus?: (connected: boolean) => void
  /** Reopen after this long without a single frame. 0 disables the watchdog. */
  silenceMs?: number
  /** First reconnect delay; doubles up to `maxDelayMs`, resets on a frame. */
  minDelayMs?: number
  maxDelayMs?: number
  create?: (url: string) => EventSourceLike
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (handle: unknown) => void
}

export interface SseConnection {
  /** Idempotent. Cancels any pending reconnect — call it from effect cleanup. */
  close(): void
}

const DEFAULT_SILENCE_MS = 20_000
const DEFAULT_MIN_DELAY_MS = 1_000
const DEFAULT_MAX_DELAY_MS = 30_000

export function connectSse(url: string, options: ConnectOptions): SseConnection {
  const {
    on,
    onStatus,
    silenceMs = DEFAULT_SILENCE_MS,
    minDelayMs = DEFAULT_MIN_DELAY_MS,
    maxDelayMs = DEFAULT_MAX_DELAY_MS,
    create = (target: string) => new EventSource(target) as EventSourceLike,
    setTimer = (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimer = (handle: unknown) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  } = options

  let source: EventSourceLike | null = null
  let retryHandle: unknown = null
  let silenceHandle: unknown = null
  let delay = minDelayMs
  let stopped = false

  function clearRetry() {
    if (retryHandle === null) return
    clearTimer(retryHandle)
    retryHandle = null
  }

  function clearSilence() {
    if (silenceHandle === null) return
    clearTimer(silenceHandle)
    silenceHandle = null
  }

  function armSilence() {
    clearSilence()
    if (silenceMs <= 0 || stopped) return
    silenceHandle = setTimer(() => {
      silenceHandle = null
      // Nothing arrived for a whole watchdog window on a stream that ticks
      // every second. Whatever the browser thinks, this connection is over.
      reconnect()
    }, silenceMs)
  }

  function scheduleReconnect() {
    if (stopped || retryHandle !== null) return
    const wait = delay
    // Widen *before* the wait elapses: a backend that is down stays down for
    // minutes, and a classroom retrying in lockstep every second is a small
    // stampede pointed at something already failing.
    delay = Math.min(delay * 2, maxDelayMs)
    retryHandle = setTimer(() => {
      retryHandle = null
      open()
    }, wait)
  }

  /** Tear the current source down and queue a fresh one. */
  function reconnect() {
    clearSilence()
    if (source) {
      source.onerror = null
      source.close()
      source = null
    }
    onStatus?.(false)
    scheduleReconnect()
  }

  function open() {
    if (stopped) return
    const next = create(url)
    source = next

    for (const [name, handler] of Object.entries(on)) {
      next.addEventListener(name, (event) => {
        if (stopped || source !== next) return
        // A frame is the only proof the stream is alive: it resets both the
        // watchdog and the backoff, so a long-running page that hiccups once
        // does not stay on a wide retry interval forever.
        delay = minDelayMs
        armSilence()
        onStatus?.(true)
        handler(event.data)
      })
    }

    next.onerror = () => {
      if (stopped || source !== next) return
      onStatus?.(false)
      // CONNECTING means the browser is retrying on its own and will get
      // there; opening our own source now would leave two live streams per
      // page — a reconnect fix that doubles the classroom's connections. Only
      // CLOSED is terminal, and only CLOSED is ours to recover from. If the
      // browser's own retry never lands, the silence watchdog takes over.
      if (next.readyState !== CLOSED) return
      clearSilence()
      // Already dead by definition, so this releases nothing the browser was
      // still holding — but it is the only thing that makes abandoning a
      // source unconditional, rather than trusting readyState to mean what it
      // says.
      next.close()
      source = null
      scheduleReconnect()
    }

    armSilence()
  }

  open()

  return {
    close() {
      stopped = true
      clearRetry()
      clearSilence()
      if (source) {
        source.onerror = null
        source.close()
        source = null
      }
    },
  }
}
