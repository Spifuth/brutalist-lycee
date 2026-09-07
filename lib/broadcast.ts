// Single-poller fan-out, as a factory.
//
// The pattern was invented for the live quiz: instead of every connected
// student's browser polling the database on its own schedule, exactly one
// interval per process reads the current state and fans the result out to
// every subscriber. With ~30 students that is 1 query/sec, not 30.
//
// It lived at module scope in lib/live-broadcast.ts — one subscriber set, one
// poller, one interval handle for the whole process. That is correct for one
// consumer and silently wrong for two: the pixel canvas would not have been a
// second broadcaster alongside the quiz, it would have fought it for the same
// timer and received its snapshots. Hence this factory. The behaviour is a
// straight port; the state simply moved into a closure.
//
// PER PROCESS, STILL. `brutalist-web` runs as a single container, so there is
// one instance of each broadcaster. Two replicas would each get their own
// poller — clients would still converge, since they read the same database,
// but they would tick independently and "one query per tick" becomes one per
// replica. Moving fan-out to Postgres LISTEN/NOTIFY is the prerequisite for
// scaling, not an optimisation.

export type Poller<T> = () => Promise<T>
export type Subscriber<T> = (snapshot: T) => void
export type ErrorHandler = (err: unknown) => void

export interface Broadcaster<T> {
  /**
   * Subscribes to snapshot updates. The poller starts on the first subscriber
   * and stops on the last unsubscribe — nobody watching means nobody polling.
   * Returns an unsubscribe function, safe to call more than once.
   */
  subscribe(fn: Subscriber<T>): () => void
  /**
   * Registers the function used to fetch the current snapshot and, optionally,
   * the tick interval. Injectable so tests never need a real database. Safe to
   * call again later; a running interval is restarted at the new period.
   */
  setPoller(fn: Poller<T>, ms?: number): void
  /**
   * One poll, delivered to every subscriber. Used by the interval tick and to
   * force an immediate refresh right after a mutation.
   *
   * Publishing to nobody is a valid state, not an error: with no poller
   * registered yet, or no subscribers right now, there is no fan-out to do, so
   * this resolves without touching the database. A forced publish must not
   * bypass the "no poll while nobody is subscribed" property that the interval
   * path enforces.
   */
  publishNow(): Promise<void>
  subscriberCount(): number
  /**
   * Registers the handler invoked when a subscriber callback throws during
   * fan-out. Defaults to console.error, so a misbehaving client is visible in
   * production logs instead of vanishing — test tidiness must not cost
   * production observability.
   */
  setErrorHandler(fn: ErrorHandler): void
  /**
   * Running count of subscriber callbacks that have thrown. Cheap, and it
   * turns "some students stopped updating" into a number an operator can read.
   */
  droppedCount(): number
  /**
   * TEST-ONLY. Clears subscribers, stops the interval, resets the poller and
   * error handler, zeroes the dropped count. Do not call from app code.
   */
  _reset(): void
}

const DEFAULT_INTERVAL_MS = 1000

export function createBroadcaster<T>(name: string, defaultIntervalMs = DEFAULT_INTERVAL_MS): Broadcaster<T> {
  const subscribers = new Set<Subscriber<T>>()

  function defaultPoller(): Promise<T> {
    throw new Error(`${name}: setPoller() must be called before polling can start`)
  }
  function defaultErrorHandler(err: unknown): void {
    console.error(`[${name}] subscriber threw:`, err)
  }

  let poller: Poller<T> = defaultPoller
  let errorHandler: ErrorHandler = defaultErrorHandler
  let intervalMs = defaultIntervalMs
  let intervalHandle: ReturnType<typeof setInterval> | null = null
  let dropped = 0

  function startPollingIfNeeded(): void {
    if (intervalHandle !== null) return
    const handle = setInterval(() => {
      void publishNow()
    }, intervalMs)
    // Never let the poller's timer keep the process alive on its own — only
    // real work should do that. It also keeps `node --test` from hanging when
    // a test leaves subscribers registered.
    handle.unref()
    intervalHandle = handle
  }

  function stopPollingIfIdle(): void {
    if (subscribers.size > 0) return
    if (intervalHandle !== null) {
      clearInterval(intervalHandle)
      intervalHandle = null
    }
  }

  async function publishNow(): Promise<void> {
    if (poller === defaultPoller) return
    if (subscribers.size === 0) return
    const snapshot = await poller()
    for (const fn of subscribers) {
      try {
        fn(snapshot)
      } catch (err) {
        // Isolate a broken subscriber: one student's connection misbehaving
        // must not stop the snapshot reaching everyone else. Reported, not
        // swallowed, so it shows up where an operator can see it.
        dropped++
        errorHandler(err)
      }
    }
  }

  return {
    subscribe(fn) {
      subscribers.add(fn)
      startPollingIfNeeded()
      let unsubscribed = false
      return () => {
        if (unsubscribed) return
        unsubscribed = true
        subscribers.delete(fn)
        stopPollingIfIdle()
      }
    },
    setPoller(fn, ms = defaultIntervalMs) {
      poller = fn
      intervalMs = ms
      if (intervalHandle !== null) {
        clearInterval(intervalHandle)
        intervalHandle = null
        startPollingIfNeeded()
      }
    },
    publishNow,
    subscriberCount: () => subscribers.size,
    setErrorHandler(fn) {
      errorHandler = fn
    },
    droppedCount: () => dropped,
    _reset() {
      subscribers.clear()
      if (intervalHandle !== null) {
        clearInterval(intervalHandle)
        intervalHandle = null
      }
      poller = defaultPoller
      errorHandler = defaultErrorHandler
      intervalMs = defaultIntervalMs
      dropped = 0
    },
  }
}
