import { getSessionUser } from "@/lib/auth"
import { query, queryOne } from "@/lib/db"
import {
  subscribe,
  setPoller,
  type LiveSnapshot,
  type LiveQuestionView,
  type LiveParticipantView,
  type LiveViewerAnswer,
  type LiveQuestionItemView,
} from "@/lib/live-broadcast"
import type { LiveState, QuestionRef } from "@/lib/live-session"
import { isVoteOpen } from "@/lib/settings"

// This is the only streaming surface in the app: Server Actions cannot
// stream, and the broadcaster this route subscribes to relies on Node
// timers and module-scope state, so it must run on the Node runtime and
// must never be statically optimised or edge-rendered.
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const HEARTBEAT_MS = 15_000

interface SessionRow {
  id: string
  quiz_slug: string
  quiz_title: string | null
  state: LiveState
  current_q_idx: number
  // Rows written before the payload snapshot landed carry only the two id
  // fields; `buildQuestionView` treats a missing `prompt` as "no question".
  question_order: Partial<QuestionRef>[]
  question_started_at: Date | null
  question_duration_s: number
}

interface ParticipantRow {
  user_id: string
  pseudo: string
  avatar_seed: string
  avatar_variant: string
  accent: string
  score: number
}

interface AnswerRow {
  user_id: string
  choice: number
  is_correct: boolean
  score: number
}

interface QuestionItemRow {
  id: string
  pseudo: string
  body: string
  upvotes: number
  created_at: Date
}

interface VoteTallyRow {
  topic_key: string
  n: string
}

const EMPTY_SNAPSHOT: LiveSnapshot = {
  state: "lobby",
  sessionId: null,
  quizSlug: null,
  quizTitle: null,
  question: null,
  questionStartedAt: null,
  questionDurationS: 0,
  participants: [],
  viewerAnswer: null,
  questions: [],
  voteTallies: {},
  voteOpen: false,
}

/**
 * `fetchSnapshot` (the shared poller) extends the broadcast `LiveSnapshot`
 * with every participant's answer to the current question, keyed by
 * `user_id`. This field is internal to this route — it is how one shared
 * query can serve every connected viewer instead of each viewer running its
 * own. It must never reach the wire: `mergeViewerAnswer` always destructures
 * it away before a frame is encoded, so what actually gets serialized is a
 * plain `LiveSnapshot` carrying only the caller's own answer.
 */
interface SharedSnapshot extends LiveSnapshot {
  answersByUserId: ReadonlyMap<string, LiveViewerAnswer>
}

const EMPTY_ANSWERS: ReadonlyMap<string, LiveViewerAnswer> = new Map()

/**
 * Builds the current question's client-facing view from the session row.
 * `correct` is withheld unless the session has moved past `"question"` —
 * this is the one line that keeps a student from reading the answer off
 * the network tab before the teacher reveals it.
 */
/** True once a ref carries the question itself, not just its ids. */
function hasPayload(ref: Partial<QuestionRef>): ref is QuestionRef {
  return typeof ref.prompt === "string" && Array.isArray(ref.options)
}

function buildQuestionView(session: SessionRow): LiveQuestionView | null {
  const ref = session.question_order[session.current_q_idx]
  if (!ref) return null
  // The payload is snapshotted onto the ref by `openSession`, so this stays
  // synchronous: the fan-out runs on a 1s tick and must not hit the database
  // per connected client. A ref without a payload is a session opened before
  // that snapshot existed — render nothing rather than a half-empty question.
  if (!hasPayload(ref)) return null
  const q = ref

  const answerRevealed =
    session.state === "reveal" || session.state === "finished" || session.state === "aborted"

  return {
    // `question_key` format contract: the bare `quiz_questions.id` (a UUID)
    // — never prefixed with a quiz slug or session id. A
    // session's `question_order` is always built from a single quiz (see
    // `startSession` in lib/live-session.ts), so this stays unique within
    // one session. Task 5's `submitAnswer()` must write
    // `live_answers.question_key` as this exact same bare id: any other
    // format (e.g. a composite key) makes both this route's answer lookup
    // (`fetchAnswers` below) and the `UNIQUE (session_id, user_id,
    // question_key)` idempotency constraint silently useless — rows just
    // never match, with no error pointing at the mismatch.
    key: ref.questionId,
    index: session.current_q_idx,
    total: session.question_order.length,
    prompt: q.prompt,
    options: q.options,
    explanation: q.explanation,
    correct: answerRevealed ? q.correct : null,
  }
}

/**
 * The shared, viewer-agnostic poll: session, scoreboard, and (once a
 * question is live) every participant's answer to it — plus, independent of
 * quiz session state, the approved-questions wall and the vote board's
 * totals and open/closed flag. All of it is fanned out by
 * lib/live-broadcast.ts to every connected client regardless of how many
 * there are: 4 queries per tick with no live-quiz session yet, 5 once a
 * lobby exists, 6 while a question is live — never N-per-subscriber. The
 * per-viewer quiz answer used to be its own query per connection here (2 + N
 * for N subscribers); it is now one query for the whole class
 * (`fetchAnswers`), sliced per viewer by `mergeViewerAnswer` with no further
 * I/O. Never look up anything specific to a single viewer here — that's
 * what mergeViewerAnswer is for.
 */
async function fetchSnapshot(): Promise<SharedSnapshot> {
  // Independent of the live-quiz session below: /questions-live and /vote
  // are their own surfaces and must be populated in every branch, including
  // "no quiz session yet". Run alongside the session lookup, not gated
  // behind it, so adding them doesn't turn one poll into a chain of three.
  const [session, questions, voteTallies, voteOpen] = await Promise.all([
    queryOne<SessionRow>(
      `SELECT s.id, s.quiz_slug, q.title AS quiz_title, s.state, s.current_q_idx,
              s.question_order, s.question_started_at, s.question_duration_s
         FROM live_sessions s
         LEFT JOIN quizzes q ON q.slug = s.quiz_slug
        ORDER BY s.created_at DESC
        LIMIT 1`,
    ),
    fetchQuestions(),
    fetchVoteTallies(),
    isVoteOpen(),
  ])

  if (!session) {
    return { ...EMPTY_SNAPSHOT, questions, voteTallies, voteOpen, answersByUserId: EMPTY_ANSWERS }
  }

  // No active quiz session yet before a lobby is shown; before the teacher
  // opens one there is nothing quiz-related to give a client except
  // "nobody's playing" — the question wall and vote totals above are
  // unaffected by this and still populated.
  if (session.state === "lobby") {
    const participants = await fetchParticipants(session.id)
    return {
      ...EMPTY_SNAPSHOT,
      state: "lobby",
      sessionId: session.id,
      quizSlug: session.quiz_slug,
      quizTitle: session.quiz_title,
      participants,
      questions,
      voteTallies,
      voteOpen,
      answersByUserId: EMPTY_ANSWERS,
    }
  }

  const participants = await fetchParticipants(session.id)
  const question = buildQuestionView(session)
  const answersByUserId = question
    ? await fetchAnswers(session.id, question.key)
    : EMPTY_ANSWERS

  return {
    state: session.state,
    sessionId: session.id,
    quizSlug: session.quiz_slug,
    quizTitle: session.quiz_title,
    question,
    questionStartedAt: session.question_started_at
      ? session.question_started_at.toISOString()
      : null,
    questionDurationS: session.question_duration_s,
    participants,
    viewerAnswer: null,
    questions,
    voteTallies,
    voteOpen,
    answersByUserId,
  }
}

async function fetchParticipants(sessionId: string): Promise<LiveParticipantView[]> {
  const rows = await query<ParticipantRow>(
    `SELECT lp.user_id, u.pseudo, u.avatar_seed, u.avatar_variant, u.accent, lp.score
       FROM live_participants lp
       JOIN users u ON u.id = lp.user_id
      WHERE lp.session_id = $1
      ORDER BY lp.score DESC, lp.joined_at ASC`,
    [sessionId],
  )
  return rows.map((r) => ({
    userId: r.user_id,
    pseudo: r.pseudo,
    avatarSeed: r.avatar_seed,
    avatarVariant: r.avatar_variant,
    accent: r.accent,
    score: r.score,
  }))
}

/**
 * Every participant's answer to the session's current question, in one
 * query — not just one viewer's. This is what lets `fetchSnapshot` serve a
 * whole classroom (~30 students, 1s tick) from a constant number of round
 * trips instead of one extra query per connected viewer. `question_key`
 * here is the bare question id produced in `buildQuestionView` above — see
 * the contract comment there.
 */
async function fetchAnswers(
  sessionId: string,
  questionKey: string,
): Promise<Map<string, LiveViewerAnswer>> {
  const rows = await query<AnswerRow>(
    `SELECT user_id, choice, is_correct, score FROM live_answers
      WHERE session_id = $1 AND question_key = $2`,
    [sessionId, questionKey],
  )
  const byUserId = new Map<string, LiveViewerAnswer>()
  for (const row of rows) {
    byUserId.set(row.user_id, {
      choice: row.choice,
      isCorrect: row.is_correct,
      score: row.score,
    })
  }
  return byUserId
}

/**
 * The approved-questions wall, one query shared by every connected viewer —
 * same "one query, not one per subscriber" property as `fetchAnswers`
 * above. Capped at 40, matching the client's own render cap, so a long
 * session's history can't grow this query unbounded.
 */
async function fetchQuestions(): Promise<LiveQuestionItemView[]> {
  const rows = await query<QuestionItemRow>(
    `SELECT id, pseudo, body, upvotes, created_at FROM questions
      WHERE status = 'approved'
      ORDER BY upvotes DESC, created_at DESC
      LIMIT 40`,
  )
  return rows.map((r) => ({
    id: r.id,
    pseudo: r.pseudo,
    body: r.body,
    upvotes: r.upvotes,
    createdAt: r.created_at.toISOString(),
  }))
}

/**
 * Raw per-topic vote counts, one query for every connected vote board.
 * Deliberately duplicates the query in app/actions/engage.ts's
 * `getVoteTallies` rather than importing it — same rationale as
 * `getLiveStateOnce` there duplicating this route's view-building logic:
 * this file exports only a route handler, and mixing a Server Action import
 * into the poller would couple two things that don't need to know about
 * each other.
 */
async function fetchVoteTallies(): Promise<Record<string, number>> {
  const rows = await query<VoteTallyRow>(
    "SELECT topic_key, COUNT(*)::text AS n FROM votes GROUP BY topic_key",
  )
  const out: Record<string, number> = {}
  for (const r of rows) out[r.topic_key] = Number(r.n)
  return out
}

// Registered once at module load. Safe to call again (e.g. a dev-server
// module reload) — setPoller() just replaces the function and restarts an
// already-running interval at the same period, per its own contract.
setPoller(fetchSnapshot, 1000)

/**
 * Slices this one viewer's own answer out of the shared snapshot's
 * `answersByUserId` map — a map lookup, not a query. `answersByUserId`
 * itself must never leave this function: it is destructured off into
 * `publicSnapshot` (typed `LiveSnapshot`, which has no such field) before
 * anything is returned, so the frame that reaches `encodeFrame` — and
 * therefore the wire — can only ever carry the caller's own answer, never
 * another student's.
 */
function mergeViewerAnswer(snapshot: SharedSnapshot, userId: string | null): LiveSnapshot {
  const { answersByUserId, ...publicSnapshot } = snapshot
  if (!userId) return publicSnapshot
  const viewerAnswer = answersByUserId.get(userId) ?? null
  return { ...publicSnapshot, viewerAnswer }
}

function encodeFrame(snapshot: LiveSnapshot): string {
  return `data: ${JSON.stringify(snapshot)}\n\n`
}

export async function GET(request: Request) {
  // Resolves the viewer (if any) from the httpOnly session cookie so their
  // own answer can be merged onto the shared snapshot below. Anonymous
  // visitors still get the shared state, just no personal answer field.
  const user = await getSessionUser()
  const userId = user?.id ?? null

  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null
  let heartbeat: ReturnType<typeof setInterval> | null = null
  let closed = false
  let streamController: ReadableStreamDefaultController<Uint8Array> | null = null

  // Shared by the abort listener and the stream's cancel() callback so a
  // disconnect is only ever torn down once, from whichever path notices it
  // first. A leaked subscriber here would keep the broadcaster's poller
  // alive forever, per lib/live-broadcast.ts's "no poll while nobody is
  // watching" contract.
  function cleanup() {
    if (closed) return
    closed = true
    if (heartbeat !== null) clearInterval(heartbeat)
    unsubscribe?.()
    try {
      streamController?.close()
    } catch {
      // Already closed by the platform (e.g. client disconnected first).
    }
  }

  function send(chunk: string) {
    if (closed || !streamController) return
    try {
      streamController.enqueue(encoder.encode(chunk))
    } catch {
      cleanup()
    }
  }

  async function deliver(snapshot: SharedSnapshot) {
    try {
      send(encodeFrame(mergeViewerAnswer(snapshot, userId)))
    } catch (err) {
      console.error("[live/stream] failed to deliver snapshot:", err)
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      streamController = controller
      request.signal.addEventListener("abort", cleanup)

      unsubscribe = subscribe((snapshot) => {
        // `subscribe`'s type only promises a `LiveSnapshot`, but the only
        // poller ever registered on this module (`fetchSnapshot`, via
        // `setPoller` above) always produces a `SharedSnapshot` — the extra
        // `answersByUserId` field is exactly how the per-viewer merge below
        // avoids a query. Safe to assert back to the type this route knows
        // it actually receives.
        void deliver(snapshot as SharedSnapshot)
      })

      // Proxies (Traefik fronts this) close an idle connection; a comment
      // line is a no-op for EventSource clients but keeps the socket alive.
      heartbeat = setInterval(() => send(": ping\n\n"), HEARTBEAT_MS)

      // Send the current snapshot immediately: a student joining mid-question
      // must not stare at a blank panel until the next poll tick.
      await deliver(await fetchSnapshot())
    },
    cancel() {
      // Fires when the consumer stops reading without a network-level abort
      // (e.g. EventSource.close()). cleanup() is idempotent, so whichever
      // of this or the abort listener runs first wins.
      cleanup()
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
