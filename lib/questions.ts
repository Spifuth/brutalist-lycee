// The pre-database mock of the question wall: posts and upvotes in
// localStorage.
//
// ⚠️ Nothing imports this file. The real question wall is in Postgres —
// `getQuestions`, `submitQuestion` and `upvoteQuestion` in
// app/actions/engage.ts, with moderation in app/actions/admin.ts — and the
// components all call those. This file carried a "SWAP POINT" note saying a
// real version would persist to the database — the swap happened, and the mock
// stayed.
//
// Which is the lesson: dead code does not announce itself. It typechecks, it
// is covered by no failing test, and it reads exactly like live code — so the
// only thing that separates "this is how the app works" from "this is how the
// app used to work" is somebody grepping for the importers. Do that before
// trusting any module you have not seen called.
import { readJSON, writeJSON } from "@/lib/storage"

export interface QuestionPost {
  id: string
  text: string
  votes: number
  at: number
  votedByMe?: boolean
}

export const QUESTIONS_STORAGE_KEY = "lycee.questions"

const SEED: QuestionPost[] = [
  { id: "seed-1", text: "Est-ce qu'on peut vraiment se faire pirater juste en cliquant sur un lien ?", votes: 27, at: Date.now() - 1000 * 60 * 60 * 5 },
  { id: "seed-2", text: "Les hackers dans les films, c'est réaliste ou pas du tout ?", votes: 41, at: Date.now() - 1000 * 60 * 60 * 3 },
  { id: "seed-3", text: "Comment savoir si mon mot de passe a fuité quelque part ?", votes: 19, at: Date.now() - 1000 * 60 * 90 },
  { id: "seed-4", text: "L'IA va-t-elle remplacer les développeurs ?", votes: 33, at: Date.now() - 1000 * 60 * 45 },
  { id: "seed-5", text: "C'est quoi la différence entre le web et Internet ?", votes: 12, at: Date.now() - 1000 * 60 * 20 },
]

/** Seeds localStorage on the first read, so a first visit gets SEED rather than an empty wall. */
export function loadQuestions(): QuestionPost[] {
  const stored = readJSON<QuestionPost[] | null>(QUESTIONS_STORAGE_KEY, null)
  if (stored === null) {
    writeJSON(QUESTIONS_STORAGE_KEY, SEED)
    return SEED
  }
  return stored
}

/** Overwrites the whole list; there is no per-item write. */
export function saveQuestions(list: QuestionPost[]): void {
  writeJSON(QUESTIONS_STORAGE_KEY, list)
}

/** Returns the new list, newest first. Trims whitespace and validates nothing else. */
export function addQuestion(text: string): QuestionPost[] {
  const list = loadQuestions()
  const post: QuestionPost = {
    id: `q-${Date.now()}`,
    text: text.trim(),
    votes: 0,
    at: Date.now(),
  }
  const next = [post, ...list]
  saveQuestions(next)
  return next
}

/** Flips this browser's own vote. The count lives only in localStorage, so "one vote each" means one per browser. */
export function toggleVote(id: string): QuestionPost[] {
  const list = loadQuestions().map((q) =>
    q.id === id ? { ...q, votes: q.votes + (q.votedByMe ? -1 : 1), votedByMe: !q.votedByMe } : q,
  )
  saveQuestions(list)
  return list
}
