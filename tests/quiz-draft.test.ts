// Guards the one thing that can silently corrupt a quiz: the index of the
// correct answer.
//
// The admin form drops blank option boxes before saving. Dropping an entry
// from a list renumbers everything after it -- so any index stored alongside
// that list has to be remapped in the same breath, or it now points at a
// different value with no error anywhere. That is the transferable shape:
// an index into a list is only meaningful next to the exact list it indexes.
import { test } from "node:test"
import assert from "node:assert/strict"
import { compactOptions, isValidCorrectIndex } from "../lib/quiz-draft.ts"

test("a blank option above the answer moves the answer's index down", () => {
  const r = compactOptions(["", "Paris", "Lyon"], 1)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, 0)
})

test("a blank option below the answer leaves the index alone", () => {
  const r = compactOptions(["Paris", "Lyon", ""], 0)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, 0)
})

test("whitespace-only counts as blank", () => {
  const r = compactOptions(["   ", "Paris"], 1)
  assert.deepEqual(r.options, ["Paris"])
  assert.equal(r.correctIndex, 0)
})

test("nothing to drop means nothing to remap", () => {
  const r = compactOptions(["Paris", "Lyon"], 1)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, 1)
})

test("two blanks above the answer both shift the index, not just the first", () => {
  const r = compactOptions(["", "", "Paris"], 2)
  assert.deepEqual(r.options, ["Paris"])
  assert.equal(r.correctIndex, 0, "each dropped blank moves the index down by one, not by a flat one")
})

test("a blank correct answer is reported, never silently reassigned", () => {
  const r = compactOptions(["Paris", "", "Lyon"], 1)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, -1)
})

test("a correctIndex past the end of the list reports no answer, not option 0", () => {
  const r = compactOptions(["Paris", "Lyon"], 7)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, -1, "an index that never matches a real option must not be clamped into a false answer")
})

test("a negative correctIndex reports no answer, not option 0", () => {
  const r = compactOptions(["Paris", "Lyon"], -3)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, -1, "an index that never matches a real option must not be clamped into a false answer")
})

test("an empty option list has no answer to remap", () => {
  const r = compactOptions([], 0)
  assert.deepEqual(r.options, [])
  assert.equal(r.correctIndex, -1)
})

// The server action cannot trust the form's remapping: it is a public POST
// endpoint, so it re-checks the index against the list it is about to save.
test("isValidCorrectIndex accepts every index inside the list", () => {
  assert.equal(isValidCorrectIndex(["Paris", "Lyon"], 0), true)
  assert.equal(isValidCorrectIndex(["Paris", "Lyon"], 1), true)
})

test("isValidCorrectIndex rejects an index at or past the end", () => {
  assert.equal(isValidCorrectIndex(["Paris", "Lyon"], 2), false)
  assert.equal(isValidCorrectIndex([], 0), false)
})

test("isValidCorrectIndex rejects negative and non-integer indexes", () => {
  assert.equal(isValidCorrectIndex(["Paris", "Lyon"], -1), false)
  assert.equal(isValidCorrectIndex(["Paris", "Lyon"], 0.5), false)
  assert.equal(isValidCorrectIndex(["Paris", "Lyon"], Number.NaN), false)
})

test("isValidCorrectIndex rejects a non-array options value", () => {
  assert.equal(isValidCorrectIndex("Paris" as unknown as string[], 0), false)
})
