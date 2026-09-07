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
