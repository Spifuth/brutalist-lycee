// A narrow guard, and worth being plain about it: this checks one quiz seed
// out of the fourteen in db/seeds/quizzes.ts.
//
// Both tests read like general rules -- every question has an explanation,
// every `correct` index lands inside its own `options` -- but both are scoped
// to `linux-bases`, the last quiz in the array. The other thirteen are not
// checked here by anything.
//
// Deleted, nothing breaks. Seeding would still succeed with a quiz whose
// correct index points past the end of its options, which reaches a student as
// a question nobody can get right.
import { test } from "node:test"
import assert from "node:assert/strict"
import { QUIZ_SEEDS } from "../db/seeds/quizzes.ts"

test("linux-bases quiz exists with expected metadata and size", () => {
  const quiz = QUIZ_SEEDS.find((q) => q.slug === "linux-bases")
  assert.ok(quiz, "missing linux-bases quiz seed")

  assert.equal(quiz.title, "Le terminal, sans peur")
  assert.equal(quiz.topic, "Linux & terminal")
  assert.equal(quiz.level, "tous")
  assert.equal(quiz.description, "cd, ls, pwd, et pourquoi la ligne de commande existe encore.")
  assert.ok(quiz.questions.length >= 6 && quiz.questions.length <= 8, "linux-bases must have between 6 and 8 questions")
})

test("linux-bases questions have explanations and valid answer index", () => {
  const quiz = QUIZ_SEEDS.find((q) => q.slug === "linux-bases")
  assert.ok(quiz, "missing linux-bases quiz seed")

  for (const [index, question] of quiz.questions.entries()) {
    assert.ok(question.explanation.trim().length > 0, `question ${index} must have an explanation`)
    assert.ok(question.correct >= 0, `question ${index} has a negative correct index`)
    assert.ok(question.correct < question.options.length, `question ${index} correct index is outside options range`)
  }
})
