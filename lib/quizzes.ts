// Quiz TYPES only. The quizzes themselves live in Postgres (`quizzes` and
// `quiz_questions`) and are read through lib/content.ts — by /quiz, by /admin
// and, since 2026-09-07, by the live session too.
//
// This file used to also export a hardcoded QUIZZES array with `getQuiz()`.
// The live path resolved its questions from it while everything else read the
// database, so a live session on `reseaux` played 3 of its 8 real questions and
// the 8 database-only quizzes could not be opened at all. Nothing errored,
// because both sources satisfied this same `Quiz` type. Do not reintroduce
// quiz content here; tests/live-quiz-source.test.ts fails if you do.

export interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  correct: number // index into options
  explanation: string
}

export interface Quiz {
  slug: string
  title: string
  theme: string
  description: string
  emojiFree?: boolean
  questions: QuizQuestion[]
}
