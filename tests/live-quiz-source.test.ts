import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { buildQuestionOrder } from "../lib/live-session.ts"

// The live quiz used to resolve its questions from the hardcoded QUIZZES array
// in lib/quizzes.ts while /quiz and /admin read Postgres. Nothing failed: both
// modules export a working Quiz shape, so a live session on `reseaux` quietly
// played 3 of its 8 real questions, and the 8 DB-only quizzes could not be
// opened at all. These tests pin the source of truth so a future edit cannot
// silently reintroduce a second one.

const LIVE_PATH_MODULES = [
  "app/actions/live.ts",
  "app/api/live/stream/route.ts",
  "components/quiz/live-quiz.tsx",
]

test("no module on the live path imports the static quiz data", () => {
  for (const file of LIVE_PATH_MODULES) {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    const importsStatic = /import\s*{[^}]*\b(getQuiz|QUIZZES)\b[^}]*}\s*from\s*["']@\/lib\/quizzes["']/.test(src)
    assert.equal(
      importsStatic,
      false,
      `${file} imports static quiz data — the live session must read the database, like /quiz does`,
    )
  }
})

test("lib/quizzes.ts carries types only, never quiz content", () => {
  const src = readFileSync(new URL("../lib/quizzes.ts", import.meta.url), "utf8")
  assert.equal(
    /export\s+const\s+QUIZZES/.test(src),
    false,
    "a hardcoded quiz catalogue is a second source of truth — quizzes live in Postgres",
  )
})

test("a question order carries each question's full payload", () => {
  const questions = [
    { id: "a", prompt: "P1", options: ["x", "y"], correct: 1, explanation: "E1" },
    { id: "b", prompt: "P2", options: ["x", "y"], correct: 0, explanation: "E2" },
  ]
  const order = buildQuestionOrder("reseaux", questions, 42)

  assert.equal(order.length, 2)
  for (const ref of order) {
    const source = questions.find((q) => q.id === ref.questionId)
    assert.ok(source, `unknown question id ${ref.questionId}`)
    // Carried on the ref so the SSE fan-out can render a question without a
    // per-tick database read, and so editing the quiz mid-session cannot
    // change the questions under the players.
    assert.equal(ref.prompt, source.prompt)
    assert.deepEqual(ref.options, source.options)
    assert.equal(ref.correct, source.correct)
    assert.equal(ref.explanation, source.explanation)
  }
})

test("the order plays every question, not a prefix", () => {
  const questions = Array.from({ length: 8 }, (_, i) => ({
    id: `q${i}`,
    prompt: `P${i}`,
    options: ["a", "b"],
    correct: 0,
    explanation: `E${i}`,
  }))
  const order = buildQuestionOrder("reseaux", questions, 7)
  assert.equal(order.length, 8)
  assert.deepEqual(new Set(order.map((r) => r.questionId)).size, 8)
})
