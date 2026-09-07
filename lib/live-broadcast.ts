import type { LiveState } from "@/lib/live-session"
import { createBroadcaster } from "./broadcast.ts"

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
  /** The quiz's title, read from Postgres alongside the session row. */
  quizTitle: string | null
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

// The generic single-poller machinery moved to ./broadcast so the live quiz
// and the pixel canvas can each own a subscriber set and a timer instead of
// fighting over one module-scope pair. The exported surface below is
// deliberately unchanged: app/api/live/stream/route.ts and
// tests/live-broadcast.test.ts should not have to know this moved.
const broadcaster = createBroadcaster<LiveSnapshot>("live-broadcast")

export const subscribe = broadcaster.subscribe
export const setPoller = broadcaster.setPoller
export const publishNow = broadcaster.publishNow
export const subscriberCount = broadcaster.subscriberCount
export const setErrorHandler = broadcaster.setErrorHandler
export const droppedCount = broadcaster.droppedCount
/** TEST-ONLY. See Broadcaster._reset in ./broadcast. */
export const _reset = broadcaster._reset
