// Guards the three places that have to agree on what a documentation block is.
//
// A doc article is JSON typed by a `type` field. That single word is read by
// three different files: the TypeScript union in lib/docs.ts, the `switch` in
// the renderer, and the starter template the admin console drops into the
// editor. The renderer ends with `default: return null`, so a type none of
// them recognises is not an error -- it is a blank page, published, with no
// stack trace and no log line. That is the transferable shape: whenever a
// string literal crosses a file boundary as a tag, only a test keeps the
// producer and the consumer spelling it the same way.
//
// Written in the source-reading style of tests/repo-hygiene.test.ts: the
// assertions read the files themselves, because the thing being checked is
// text a human typed, not a value the program computes.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { DOC_BLOCK_TYPES } from "../lib/docs.ts"

const RENDERER = "components/docs/doc-blocks.tsx"
const CONSOLE = "components/admin/tabs/docs-tab.tsx"

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8")

/** The `case "…":` labels of the renderer's switch — the types that actually draw something. */
function renderedTypes(): string[] {
  return [...read(RENDERER).matchAll(/case "([a-z]+)":/g)].map((m) => m[1])
}

/** The `type: "…"` members of the DocBlock union in lib/docs.ts. */
function declaredTypes(): string[] {
  return [...read("lib/docs.ts").matchAll(/\|\s*\{\s*type: "([a-z]+)"/g)].map((m) => m[1])
}

/** The blocks the console seeds into a new article, parsed the way the editor's JSON is. */
function templateBlocks(): { type: string }[] {
  const m = /blocksText: '([^']*)'/.exec(read(CONSOLE))
  assert.ok(m, `no blocksText starter template found in ${CONSOLE}`)
  // In the source the JSON lives inside a single-quoted JS string, so "\n" is
  // still a backslash and an n. JSON.parse rejects that between tokens; the
  // editor only ever sees the unescaped text, so unescape before parsing.
  return JSON.parse(m[1].replace(/\\n/g, "\n"))
}

/** The block types the on-screen help lists to whoever is writing an article. */
function hintedTypes(): string[] {
  const m = /hint='([^']*"type"[^']*)'/.exec(read(CONSOLE))
  assert.ok(m, `no block-type hint found in ${CONSOLE}`)
  return [...m[1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]).filter((t) => t !== "type")
}

test("the starter template only uses block types the renderer handles", () => {
  for (const block of templateBlocks()) {
    assert.ok(
      DOC_BLOCK_TYPES.includes(block.type),
      `the console seeds { "type": "${block.type}" }, which the renderer drops on its default branch — an article written from the template publishes blank`,
    )
  }
})

test("the on-screen help lists block types the renderer handles", () => {
  for (const type of hintedTypes()) {
    assert.ok(
      DOC_BLOCK_TYPES.includes(type),
      `the hint teaches "${type}", which renders nothing — following the on-screen help would fail every time`,
    )
  }
})

test("the on-screen help names every block type the renderer handles", () => {
  for (const type of DOC_BLOCK_TYPES) {
    assert.ok(
      hintedTypes().includes(type),
      `the renderer handles "${type}", but the hint never mentions it — an article writer reading the hint would never know it exists`,
    )
  }
})

test("DOC_BLOCK_TYPES matches the switch that renders the blocks", () => {
  assert.deepEqual(
    [...DOC_BLOCK_TYPES].sort(),
    renderedTypes().sort(),
    `DOC_BLOCK_TYPES has drifted from the switch in ${RENDERER}`,
  )
})

test("DOC_BLOCK_TYPES matches the DocBlock union it describes", () => {
  assert.deepEqual([...DOC_BLOCK_TYPES].sort(), declaredTypes().sort(), "DOC_BLOCK_TYPES has drifted from DocBlock")
})
