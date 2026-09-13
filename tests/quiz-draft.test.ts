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
import { compactOptions } from "../lib/quiz-draft.ts"

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

test("a blank correct answer is reported, never silently reassigned", () => {
  const r = compactOptions(["Paris", "", "Lyon"], 1)
  assert.deepEqual(r.options, ["Paris", "Lyon"])
  assert.equal(r.correctIndex, -1)
})
