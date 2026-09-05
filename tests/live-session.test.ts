import { test } from "node:test"
import assert from "node:assert/strict"
import { calcScore, shouldAutoReveal, nextState } from "../lib/live-session.ts"

test("a wrong answer scores zero regardless of speed", () => {
  assert.equal(calcScore(10, 15, false), 0)
  assert.equal(calcScore(14000, 15, false), 0)
})

test("a correct answer scores more the faster it arrives", () => {
  const fast = calcScore(500, 15, true)
  const slow = calcScore(14000, 15, true)
  assert.ok(fast > slow, `expected ${fast} > ${slow}`)
})

test("a correct answer always scores at least the base", () => {
  assert.ok(calcScore(15000, 15, true) >= 500)
})

test("scoring never exceeds the documented maximum", () => {
  assert.ok(calcScore(0, 15, true) <= 1000)
})

test("an answer arriving after the window still scores the base, not negative", () => {
  assert.ok(calcScore(99999, 15, true) >= 500)
})

test("auto-reveal fires only once the window has elapsed", () => {
  const t0 = new Date("2026-09-05T10:00:00Z")
  const mid = new Date("2026-09-05T10:00:10Z")
  const after = new Date("2026-09-05T10:00:16Z")
  assert.equal(shouldAutoReveal(t0, 15, mid), false)
  assert.equal(shouldAutoReveal(t0, 15, after), true)
})

test("state transitions follow the teacher-driven table", () => {
  assert.equal(nextState("lobby", "start"), "question")
  assert.equal(nextState("question", "reveal"), "reveal")
  assert.equal(nextState("reveal", "next"), "question")
  assert.equal(nextState("reveal", "finish"), "finished")
  assert.equal(nextState("question", "abort"), "aborted")
})

test("illegal transitions are refused rather than silently allowed", () => {
  assert.throws(() => nextState("finished", "next"))
  assert.throws(() => nextState("lobby", "reveal"))
})
