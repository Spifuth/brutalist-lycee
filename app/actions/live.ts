"use server"

import { query, queryOne } from "@/lib/db"
import { requireAdmin, requireUser, getSessionUser } from "@/lib/auth"
import { publishNow } from "@/lib/live-broadcast"
import type {
  LiveSnapshot,
  LiveQuestionView,
  LiveParticipantView,
  LiveViewerAnswer,
} from "@/lib/live-broadcast"
import { buildQuestionOrder, calcScore, nextState, type QuestionRef, type LiveState } from "@/lib/live-session"
import { getQuiz } from "@/lib/quizzes"
import { isVoteOpen, isAiOpen, isTerminalOpen, setSetting } from "@/lib/settings"

// SWAP POINT: the only place teacher/player intent turns into a DB write for
// the live quiz. app/api/live/stream/route.ts (Task 4) is read-only — it
// polls and fans out. Every mutation here ends with `publishNow()` so the
// next fan-out tick (or sooner, since this forces one) carries the change
// to every connected client without waiting up to 1s for the interval.

interface SessionRow {
  id: string
  quiz_slug: string
  state: LiveState
  current_q_idx: number
  question_order: QuestionRef[]
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

/**
 * The one live session that matters right now: the most recently created
 * row. Only one session may be non-terminal at a time (enforced by
 * `openSession` below), so "most recent" and "the current one" coincide —
 * this mirrors the query in app/api/live/stream/route.ts's `fetchSnapshot`
 * exactly, so admin actions and the stream always agree on which session is
 * "current".
 */
async function getCurrentSession(): Promise<SessionRow | null> {
  return queryOne<SessionRow>(
    `SELECT id, quiz_slug, state, current_q_idx, question_order,
            question_started_at, question_duration_s
       FROM live_sessions
      ORDER BY created_at DESC
      LIMIT 1`,
  )
}

async function requireCurrentSession(): Promise<SessionRow> {
  const session = await getCurrentSession()
  if (!session) throw new Error("Aucune session en direct.")
  return session
}

async function setSessionState(id: string, state: LiveState): Promise<void> {
  await query("UPDATE live_sessions SET state = $1, updated_at = now() WHERE id = $2", [state, id])
}

// ---------------- Admin: session control ----------------
// Every one of these begins with `await requireAdmin()` as its first
// statement. `/admin` gates the console in the browser only — the action is
// the real gate, so a crafted POST that skips the UI entirely must still be
// refused here, before any query runs.

/**
 * Opens a new session for `quizSlug`, in `lobby` state. Only one session may
 * be non-terminal at a time, so any currently running session (lobby,
 * question or reveal) is aborted first — a teacher opening a new quiz must
 * not leave an orphaned live session for stragglers to keep polling.
 */
export async function openSession(quizSlug: string, durationS: number): Promise<void> {
  await requireAdmin()

  const quiz = getQuiz(quizSlug)
  if (!quiz || quiz.questions.length === 0) {
    throw new Error("Quiz introuvable ou sans questions.")
  }
  if (!Number.isFinite(durationS) || durationS <= 0) {
    throw new Error("Durée de question invalide.")
  }

  const existing = await getCurrentSession()
  if (existing && existing.state !== "finished" && existing.state !== "aborted") {
    await setSessionState(existing.id, nextState(existing.state, "abort"))
  }

  // Shuffled once, here, and stored as `question_order` — every client
  // (and every future admin action on this session) sees the same order;
  // a reload can never reshuffle it. Always built from this single
  // `quizSlug`, which is what lets Task 5's `submitAnswer` and the stream
  // route's `buildQuestionView` both key `live_answers.question_key` on the
  // bare question id without risk of collision across quizzes.
  const order = buildQuestionOrder(quizSlug, quiz.questions)
  await query(
    `INSERT INTO live_sessions (quiz_slug, state, current_q_idx, question_order, question_duration_s)
     VALUES ($1, 'lobby', 0, $2, $3)`,
    [quizSlug, JSON.stringify(order), durationS],
  )

  await publishNow()
}

/** lobby -> question. Anchors the server-authoritative clock for question 0. */
export async function startSession(): Promise<void> {
  await requireAdmin()
  const session = await requireCurrentSession()
  const state = nextState(session.state, "start")
  await query(
    `UPDATE live_sessions
        SET state = $1, current_q_idx = 0, question_started_at = now(), updated_at = now()
      WHERE id = $2`,
    [state, session.id],
  )
  await publishNow()
}

/** question -> reveal. This is the line that puts the correct answer on the wire. */
export async function revealAnswer(): Promise<void> {
  await requireAdmin()
  const session = await requireCurrentSession()
  const state = nextState(session.state, "reveal")
  await setSessionState(session.id, state)
  await publishNow()
}

/** reveal -> question, advancing to the next question and re-anchoring the clock. */
export async function nextQuestion(): Promise<void> {
  await requireAdmin()
  const session = await requireCurrentSession()
  const state = nextState(session.state, "next")

  const nextIdx = session.current_q_idx + 1
  if (nextIdx >= session.question_order.length) {
    throw new Error("Il n'y a plus de question suivante — utilise Terminer.")
  }

  await query(
    `UPDATE live_sessions
        SET state = $1, current_q_idx = $2, question_started_at = now(), updated_at = now()
      WHERE id = $3`,
    [state, nextIdx, session.id],
  )
  await publishNow()
}

/** reveal -> finished. Terminal: the podium is the final scoreboard. */
export async function finishSession(): Promise<void> {
  await requireAdmin()
  const session = await requireCurrentSession()
  const state = nextState(session.state, "finish")
  await setSessionState(session.id, state)
  await publishNow()
}

/** lobby|question|reveal -> aborted. Terminal, same as finished but not a real ending. */
export async function abortSession(): Promise<void> {
  await requireAdmin()
  const session = await requireCurrentSession()
  const state = nextState(session.state, "abort")
  await setSessionState(session.id, state)
  await publishNow()
}

// ---------------- Admin: vote/AI toggles ----------------
// lib/settings.ts already has the read side (isVoteOpen/isAiOpen) and a
// generic setSetting(), but nothing admin-facing ever called the write side
// before this — the admin Live tab is the first UI that needs to flip these,
// so the two functions below are that missing path. Same
// requireAdmin()-first contract as every other admin action in this file.

export interface LiveSettings {
  voteOpen: boolean
  aiOpen: boolean
  /**
   * The teacher's half of the terminal gateway decision only — whether the
   * gateway infrastructure exists at all is `TERMINAL_WS_URL`, a plain env
   * var this action never reads or writes. See
   * app/api/terminal/config/route.ts for where the two are combined.
   */
  terminalOpen: boolean
}

/** Current values of the three teacher-facing toggles the admin Live tab shows. */
export async function getLiveSettings(): Promise<LiveSettings> {
  await requireAdmin()
  const [voteOpen, aiOpen, terminalOpen] = await Promise.all([isVoteOpen(), isAiOpen(), isTerminalOpen()])
  return { voteOpen, aiOpen, terminalOpen }
}

/**
 * Writes all three settings in one round trip. `publishNow()` forces the
 * change onto the next /api/live/stream frame immediately — the same reason
 * every session-control action above ends with it — so /vote's open/closed
 * banner flips live instead of waiting up to 1s.
 */
export async function setLiveSettings(settings: LiveSettings): Promise<void> {
  await requireAdmin()
  await Promise.all([
    setSetting("vote_open", settings.voteOpen),
    setSetting("ai_open", settings.aiOpen),
    setSetting("terminal_open", settings.terminalOpen),
  ])
  await publishNow()
}

// ---------------- Player actions ----------------

/** Joins the current session's scoreboard. Idempotent — rejoining is a no-op. */
/**
 * Wipe every vote. Admin-only, irreversible, and deliberately blunt: the
 * vote board is a warm-up exercise that a teacher may want to run twice —
 * once as a demo and once for real — and there is no per-topic reset that
 * would be less confusing than "clear it all".
 *
 * Returns how many rows were removed so the caller can say so rather than
 * claiming success over a no-op. Ends with publishNow() so every connected
 * student's board empties immediately instead of on the next tick.
 */
export async function clearVotes(): Promise<{ deleted: number }> {
  await requireAdmin()
  // RETURNING because lib/db's query() yields rows, not a pg result — there
  // is no rowCount to read.
  const rows = await query<{ id: string }>("DELETE FROM votes RETURNING id")
  await publishNow()
  return { deleted: rows.length }
}

/** Current vote count, so the admin UI can show what it is about to delete. */
export async function countVotes(): Promise<number> {
  await requireAdmin()
  const row = await queryOne<{ n: string }>("SELECT COUNT(*)::text AS n FROM votes")
  return Number(row?.n ?? 0)
}

export async function joinSession(): Promise<void> {
  const user = await requireUser()
  const session = await getCurrentSession()
  if (!session || session.state === "finished" || session.state === "aborted") {
    throw new Error("Aucune session en direct à rejoindre.")
  }
  await query(
    `INSERT INTO live_participants (session_id, user_id) VALUES ($1, $2)
     ON CONFLICT (session_id, user_id) DO NOTHING`,
    [session.id, user.id],
  )
  await publishNow()
}

export interface SubmitAnswerResult {
  /** False when this call was a duplicate — the constraint fired, no score was added. */
  inserted: boolean
  isCorrect: boolean
  /** The score awarded by *this* call. Always 0 when `inserted` is false. */
  score: number
}

/**
 * Records one participant's answer to the current question. Three
 * deliberate properties, each guarding a concrete way this could go wrong:
 *
 * 1. `elapsed_ms` is computed here, from `question_started_at` (set by
 *    `startSession`/`nextQuestion` above) and the server's own clock — the
 *    caller never supplies a timestamp, so a client cannot claim to have
 *    answered faster than it did. Scoring is speed-weighted; a
 *    client-supplied elapsed time would just be a client-chosen score.
 * 2. The insert is `ON CONFLICT (session_id, user_id, question_key) DO
 *    NOTHING`, not a check-then-insert. A SELECT-then-INSERT would leave a
 *    window where a double-tap or a retried request could both pass the
 *    check before either commits; the constraint is atomic and immune to
 *    that race. `RETURNING id` tells us, from the same round trip, whether
 *    this call actually won the insert — a duplicate returns zero rows, not
 *    an error, so it can be reported as a no-op rather than a failure.
 * 3. Refused outright when `state !== "question"` — once the session has
 *    moved to `"reveal"`, `q.correct` is already on the wire (see
 *    `buildQuestionView` in app/api/live/stream/route.ts), so an "answer"
 *    submitted after that point would just be reading the solution back.
 */
export async function submitAnswer(questionKey: string, choice: number): Promise<SubmitAnswerResult> {
  const user = await requireUser()
  const session = await requireCurrentSession()

  if (session.state !== "question") {
    throw new Error("La question n'est pas ouverte aux réponses.")
  }

  const ref = session.question_order[session.current_q_idx]
  const quiz = ref ? getQuiz(ref.quizSlug) : undefined
  const q = quiz?.questions.find((item) => item.id === ref?.questionId)
  if (!ref || !q) {
    throw new Error("Question actuelle introuvable.")
  }

  // `question_key` format contract (see app/api/live/stream/route.ts's
  // `buildQuestionView`): the bare quiz question id, e.g. "q1" — never
  // prefixed with a quiz slug or session id. A mismatch here means the
  // caller's client is showing a stale question (already superseded by
  // `nextQuestion`); recording it under the wrong key would make both this
  // constraint and the stream route's per-viewer lookup silently useless.
  if (questionKey !== q.id) {
    throw new Error("Cette réponse ne correspond pas à la question en cours.")
  }
  if (!Number.isInteger(choice) || choice < 0 || choice >= q.options.length) {
    throw new Error("Choix invalide.")
  }
  if (!session.question_started_at) {
    throw new Error("La question n'a pas encore démarré.")
  }

  const elapsedMs = Date.now() - session.question_started_at.getTime()
  const isCorrect = choice === q.correct
  const score = calcScore(elapsedMs, session.question_duration_s, isCorrect)

  const insertedRows = await query<{ id: string }>(
    `INSERT INTO live_answers (session_id, user_id, question_key, choice, is_correct, score, elapsed_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (session_id, user_id, question_key) DO NOTHING
     RETURNING id`,
    [session.id, user.id, questionKey, choice, isCorrect, score, elapsedMs],
  )

  if (insertedRows.length === 0) {
    // Duplicate: the constraint did its job. No-op, not an error, no second score.
    return { inserted: false, isCorrect, score: 0 }
  }

  // Guarantee a scoreboard row exists even if `joinSession` was never
  // called (e.g. a reconnect mid-session) — the increment below must not
  // silently affect zero rows.
  await query(
    `INSERT INTO live_participants (session_id, user_id) VALUES ($1, $2)
     ON CONFLICT (session_id, user_id) DO NOTHING`,
    [session.id, user.id],
  )
  await query("UPDATE live_participants SET score = score + $1 WHERE session_id = $2 AND user_id = $3", [
    score,
    session.id,
    user.id,
  ])

  await publishNow()
  return { inserted: true, isCorrect, score }
}

// ---------------- Fallback / test snapshot ----------------

/**
 * Non-streaming equivalent of one `/api/live/stream` frame, merged for the
 * calling user. For a client that hasn't opened the SSE connection yet (or
 * had it drop) and for tests/scripts that want the current server-side
 * state without holding a stream open. Deliberately duplicates the small
 * amount of view-building logic in app/api/live/stream/route.ts rather than
 * importing from it — that file exports only a route handler, and this task
 * creates no other file.
 */
export async function getLiveStateOnce(): Promise<LiveSnapshot> {
  const user = await getSessionUser()
  const session = await getCurrentSession()

  if (!session) {
    return {
      state: "lobby",
      sessionId: null,
      quizSlug: null,
      question: null,
      questionStartedAt: null,
      questionDurationS: 0,
      participants: [],
      viewerAnswer: null,
    }
  }

  const participantRows = await query<ParticipantRow>(
    `SELECT lp.user_id, u.pseudo, u.avatar_seed, u.avatar_variant, u.accent, lp.score
       FROM live_participants lp
       JOIN users u ON u.id = lp.user_id
      WHERE lp.session_id = $1
      ORDER BY lp.score DESC, lp.joined_at ASC`,
    [session.id],
  )
  const participants: LiveParticipantView[] = participantRows.map((r) => ({
    userId: r.user_id,
    pseudo: r.pseudo,
    avatarSeed: r.avatar_seed,
    avatarVariant: r.avatar_variant,
    accent: r.accent,
    score: r.score,
  }))

  let question: LiveQuestionView | null = null
  let viewerAnswer: LiveViewerAnswer | null = null

  if (session.state !== "lobby") {
    const ref = session.question_order[session.current_q_idx]
    const quiz = ref ? getQuiz(ref.quizSlug) : undefined
    const q = quiz?.questions.find((item) => item.id === ref?.questionId)
    if (ref && q) {
      const answerRevealed =
        session.state === "reveal" || session.state === "finished" || session.state === "aborted"
      question = {
        key: q.id,
        index: session.current_q_idx,
        total: session.question_order.length,
        prompt: q.prompt,
        options: q.options,
        explanation: q.explanation,
        correct: answerRevealed ? q.correct : null,
      }
      if (user) {
        const answer = await queryOne<{ choice: number; is_correct: boolean; score: number }>(
          `SELECT choice, is_correct, score FROM live_answers
            WHERE session_id = $1 AND user_id = $2 AND question_key = $3`,
          [session.id, user.id, q.id],
        )
        viewerAnswer = answer
          ? { choice: answer.choice, isCorrect: answer.is_correct, score: answer.score }
          : null
      }
    }
  }

  return {
    state: session.state,
    sessionId: session.id,
    quizSlug: session.quiz_slug,
    question,
    questionStartedAt: session.question_started_at
      ? session.question_started_at.toISOString()
      : null,
    questionDurationS: session.question_duration_s,
    participants,
    viewerAnswer,
  }
}
