import type { LiveState } from "@/lib/live-session"

// SWAP POINT: single-poller broadcaster for the teacher-driven live quiz.
// Instead of every connected student's browser polling the database on its
// own schedule, exactly one interval per process reads the current session
// state and fans the result out to every subscriber. With ~30 students in a
// classroom that is the difference between 1 query/sec and 30.
//
// This state is per-process. `brutalist-web` runs as a single container, so
// there is exactly one poller and one subscriber set. Scaling this service
// to two replicas would give each its own poller — clients would still
// converge (they read the same database) but would tick independently, and
// the "one query per tick" property becomes one per replica. Moving
// fan-out to Postgres LISTEN/NOTIFY is the prerequisite for scaling, not an
// optimisation.

/** The current question's client-facing content. */
export interface LiveQuestionView {
  /** Matches `live_answers.question_key` for this question. */
  key: string
  /** 0-based index into the session's `question_order`. */
  index: number
  total: number
  prompt: string
  options: string[]
  explanation: string
  /**
   * Index into `options`. Withheld (`null`) while `state` is `"lobby"` or
   * `"question"` — the correct answer must never reach a client before the
   * teacher reveals it, or a student reading the network tab wins every
   * time. Only populated once `state` is `"reveal"`, `"finished"` or
   * `"aborted"`.
   */
  correct: number | null
}

/** One row of the live scoreboard. */
export interface LiveParticipantView {
  userId: string
  pseudo: string
  avatarSeed: string
  avatarVariant: string
  accent: string
  score: number
}

/** This viewer's own answer for the current question, if they've submitted one. */
export interface LiveViewerAnswer {
  choice: number
  isCorrect: boolean
  score: number
}

/** One approved question on the live wall (components/questions/live-questions.tsx). */
export interface LiveQuestionItemView {
  id: string
  pseudo: string
  body: string
  /** The one real reaction this app tracks — see app/actions/engage.ts's upvoteQuestion(). */
  upvotes: number
  createdAt: string
}

/**
 * The full picture broadcast to every connected client on each tick:
 * session state, the current question (answer withheld pre-reveal, see
 * `LiveQuestionView.correct`), the server-authoritative clock anchor, and
 * the scoreboard.
 *
 * `viewerAnswer` is the one field that is NOT shared — it is specific to
 * whichever student is holding the connection. The poller that produces
 * this object runs once per tick for every subscriber combined (that's the
 * whole point of this module), so it cannot know who is listening and
 * always leaves `viewerAnswer: null`. The SSE route handler (Task 4) merges
 * in the real value per connection, after the shared snapshot arrives.
 */
export interface LiveSnapshot {
  state: LiveState
  sessionId: string | null
  quizSlug: string | null
  question: LiveQuestionView | null
  /** ISO timestamp, or null before the first question has started. */
  questionStartedAt: string | null
  questionDurationS: number
  participants: LiveParticipantView[]
  viewerAnswer: LiveViewerAnswer | null
  /**
   * The approved-questions wall (components/questions/live-questions.tsx),
   * most-upvoted/newest first. Optional so app/actions/live.ts's
   * `getLiveStateOnce()` — a non-streaming fallback this task does not
   * touch — still satisfies this type without listing it; the only
   * producer that actually sets it is app/api/live/stream/route.ts's
   * shared poller.
   */
  questions?: LiveQuestionItemView[]
  /**
   * Raw per-topic vote counts from the `votes` table; components/vote/vote-board.tsx
   * adds each topic's static display `base` (lib/vote.ts) on top. Optional
   * for the same reason as `questions` above.
   */
  voteTallies?: Record<string, number>
  /**
   * Mirrors lib/settings.ts's `isVoteOpen()` at the time of the tick — the
   * server-side truth for rendering /vote's closed state live. Display-only:
   * the vote action re-checks isVoteOpen() itself and does not trust this
   * field. Optional for the same reason as `questions` above.
   */
  voteOpen?: boolean
}

type Poller = () => Promise<LiveSnapshot>
type Subscriber = (snapshot: LiveSnapshot) => void

const DEFAULT_INTERVAL_MS = 1000

const subscribers = new Set<Subscriber>()

function defaultPoller(): Promise<LiveSnapshot> {
  throw new Error("live-broadcast: setPoller() must be called before polling can start")
}

let poller: Poller = defaultPoller
let intervalMs = DEFAULT_INTERVAL_MS
let intervalHandle: ReturnType<typeof setInterval> | null = null

type ErrorHandler = (err: unknown) => void

function defaultErrorHandler(err: unknown): void {
  console.error("[live-broadcast] subscriber threw:", err)
}

let errorHandler: ErrorHandler = defaultErrorHandler
let dropped = 0

/**
 * Registers the function invoked when a subscriber callback throws during
 * fan-out (see `publishNow`). Defaults to logging via `console.error` so a
 * misbehaving client is visible in production logs instead of vanishing
 * silently. Injectable so tests can collect the error and assert on it
 * instead of printing to stderr — test tidiness must not cost production
 * observability.
 */
export function setErrorHandler(fn: ErrorHandler): void {
  errorHandler = fn
}

/**
 * Running count of subscriber callbacks that have thrown during fan-out.
 * Cheap, and it turns "some students stopped updating" into a number an
 * operator can actually read.
 */
export function droppedCount(): number {
  return dropped
}

function startPollingIfNeeded(): void {
  if (intervalHandle !== null) return
  const handle = setInterval(() => {
    void publishNow()
  }, intervalMs)
  // Never let the poller's timer keep the process alive on its own — only
  // real work (an open server, an active request) should do that. This also
  // keeps `node --test` from hanging when a test leaves subscribers
  // registered; `_reset()` is what actually clears the interval and
  // subscriber set between tests, this just stops it blocking process exit.
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

/**
 * Registers the function used to fetch the current live-session snapshot
 * and, optionally, the tick interval. Injectable so tests (and any future
 * caller) never need a real database. Safe to call again later, e.g. if the
 * poll target changes — an already-running interval is restarted at the
 * new period.
 */
export function setPoller(fn: Poller, ms: number = DEFAULT_INTERVAL_MS): void {
  poller = fn
  intervalMs = ms
  if (intervalHandle !== null) {
    clearInterval(intervalHandle)
    intervalHandle = null
    startPollingIfNeeded()
  }
}

/**
 * Subscribes to snapshot updates. The poller starts on the first subscriber
 * and stops on the last unsubscribe — nobody watching means nobody polling.
 * Returns an unsubscribe function.
 */
export function subscribe(fn: Subscriber): () => void {
  subscribers.add(fn)
  startPollingIfNeeded()

  let unsubscribed = false
  return () => {
    if (unsubscribed) return
    unsubscribed = true
    subscribers.delete(fn)
    stopPollingIfIdle()
  }
}

/** Number of currently active subscribers. */
export function subscriberCount(): number {
  return subscribers.size
}

/**
 * Performs exactly one poll and delivers the result to every subscriber.
 * Used both by the interval tick and to force an immediate refresh right
 * after a mutation (Task 5). A subscriber that throws is caught and
 * isolated — one broken client must not take down the rest of the class.
 *
 * Publishing to nobody is a valid state, not an error: if no poller has
 * been registered yet (e.g. a Server Action mutates the database before
 * `/api/live/stream` has been hit once in this process, so `setPoller()`
 * never ran) or there are simply no subscribers right now, there is no
 * fan-out to do and nothing to report, so this resolves immediately
 * without touching the database. This mirrors the "no poll while nobody is
 * subscribed" property enforced by `startPollingIfNeeded`/`stopPollingIfIdle`
 * for the interval path — a forced immediate publish must not bypass it.
 */
export async function publishNow(): Promise<void> {
  if (poller === defaultPoller) return
  if (subscribers.size === 0) return
  const snapshot = await poller()
  for (const fn of subscribers) {
    try {
      fn(snapshot)
    } catch (err) {
      // Isolate a broken subscriber: one student's connection misbehaving
      // must not stop the snapshot from reaching everyone else. The failure
      // is reported (via errorHandler/droppedCount), not swallowed, so it
      // shows up somewhere an operator can see it instead of just looking
      // like a student who silently stopped updating.
      dropped++
      errorHandler(err)
    }
  }
}

/**
 * TEST-ONLY. Clears all subscribers, stops any active interval, and resets
 * the poller and error handler to their unset/default state, zeroing the
 * dropped-subscriber count. Exists so tests don't leak timers, subscribers,
 * or error handlers into one another; do not call this from application
 * code.
 */
export function _reset(): void {
  subscribers.clear()
  if (intervalHandle !== null) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
  poller = defaultPoller
  intervalMs = DEFAULT_INTERVAL_MS
  errorHandler = defaultErrorHandler
  dropped = 0
}
