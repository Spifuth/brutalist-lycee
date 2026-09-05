import type { QuizQuestion } from "@/lib/quizzes"

// SWAP POINT: this module is the server-authoritative replacement for the
// browser-simulated /live quiz (components/quiz/live-quiz.tsx). It is pure —
// no DB, no React — so the scoring/timing/state-machine rules that used to
// live inline in a useEffect can be tested in isolation and reused by the
// real teacher-driven session once it exists.

/** A lightweight reference into a quiz's question list, in play order. */
export interface QuestionRef {
  quizSlug: string
  questionId: string
}

export type LiveState = "lobby" | "question" | "reveal" | "finished" | "aborted"
export type LiveOp = "start" | "reveal" | "next" | "finish" | "abort"

/**
 * Deterministic, seedable PRNG (mulberry32) so `buildQuestionOrder` can be
 * unit-tested without relying on `Math.random`.
 */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Returns the quiz's questions as `QuestionRef`s in shuffled play order.
 * Pass `seed` for a deterministic (testable) shuffle; omit it for a fresh
 * random shuffle each call (Fisher-Yates).
 */
export function buildQuestionOrder(
  quizSlug: string,
  questions: QuizQuestion[],
  seed?: number,
): QuestionRef[] {
  const refs: QuestionRef[] = questions.map((q) => ({ quizSlug, questionId: q.id }))
  const random = seed === undefined ? Math.random : mulberry32(seed)

  for (let i = refs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const tmp = refs[i]
    refs[i] = refs[j]
    refs[j] = tmp
  }

  return refs
}

const BASE_SCORE = 500
const MAX_BONUS = 500

/**
 * Scoring formula ported from the browser simulation
 * (components/quiz/live-quiz.tsx): a wrong answer scores 0; a correct
 * answer scores a 500 base plus up to 500 more scaled by the fraction of
 * the question's time window still remaining when the answer arrived.
 * Remaining time is clamped to [0, durationS] first, so a late answer
 * (elapsedMs beyond the window) still floors at the 500 base rather than
 * going negative, and nothing can exceed 1000.
 */
export function calcScore(elapsedMs: number, durationS: number, isCorrect: boolean): number {
  if (!isCorrect) return 0

  const durationMs = durationS * 1000
  const remainingMs = Math.max(0, Math.min(durationMs, durationMs - elapsedMs))
  const remainingFraction = durationMs === 0 ? 0 : remainingMs / durationMs

  return BASE_SCORE + Math.round(remainingFraction * MAX_BONUS)
}

/**
 * True once `durationS` seconds have elapsed since `startedAt`, as of `now`.
 * The teacher-driven server uses this to auto-reveal a question whose timer
 * has run out even if no explicit "reveal" op arrives.
 */
export function shouldAutoReveal(startedAt: Date, durationS: number, now: Date): boolean {
  return now.getTime() >= startedAt.getTime() + durationS * 1000
}

/**
 * Explicit transition table for the teacher-driven live session. Anything
 * not listed here is refused (throws) rather than silently allowed — an
 * illegal transition mid-session would otherwise leave a classroom of
 * students staring at an impossible state.
 */
const TRANSITIONS: Record<LiveState, Partial<Record<LiveOp, LiveState>>> = {
  lobby: {
    start: "question",
    abort: "aborted",
  },
  question: {
    reveal: "reveal",
    abort: "aborted",
  },
  reveal: {
    next: "question",
    finish: "finished",
    abort: "aborted",
  },
  finished: {},
  aborted: {},
}

export function nextState(current: LiveState, op: LiveOp): LiveState {
  const to = TRANSITIONS[current]?.[op]
  if (!to) {
    throw new Error(`Illegal live-session transition: cannot "${op}" from state "${current}"`)
  }
  return to
}
