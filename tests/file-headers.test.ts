// Guards the header gate itself.
//
// The one case worth a test rather than a reading: in a Next.js file,
// `"use client"` must stay on line 1 — it is a directive prologue, and the
// bundler stops recognising it the moment a statement precedes it. So the
// gate has to treat a directive as something to skip past, not as the header
// it is looking for, and it must not accept a file that has the directive and
// nothing else. Both halves are easy to get wrong in opposite directions.
import { test } from "node:test"
import assert from "node:assert/strict"
import { hasHeader } from "../scripts/check-file-headers.mjs"

test("a line comment on the first line is a header", () => {
  assert.equal(hasHeader("// what this file makes\nexport const a = 1\n"), true)
})

test("a block comment on the first line is a header", () => {
  assert.equal(hasHeader("/* what this file makes */\nexport const a = 1\n"), true)
})

test("code on the first line means no header", () => {
  assert.equal(hasHeader('import { x } from "y"\n'), false)
})

test("a directive is a prologue, so the comment under it still counts", () => {
  assert.equal(hasHeader('"use client"\n\n// what this file makes\nimport React from "react"\n'), true)
  assert.equal(hasHeader("'use server'\n// what this file makes\n"), true)
})

test("a directive on its own is not a header", () => {
  assert.equal(hasHeader('"use client"\n\nimport React from "react"\n'), false)
})

test("leading blank lines are skipped", () => {
  assert.equal(hasHeader("\n\n// what this file makes\n"), true)
})
