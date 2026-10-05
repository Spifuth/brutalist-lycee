// Guards the `$ man …` label on each /docs card: the one lib/docs.ts declares
// is the one the page shows.
//
// The value crosses three files before anyone sees it -- declared in
// lib/docs.ts, written to doc_subjects by db/seed.ts, read back by
// lib/content.ts -- and a field can be dropped at any of those hops without
// anything failing. The page still renders, with a label computed from
// something else. A field that is written and never read is a silent lie in
// the data structure: the next author spends time choosing a value that will
// never appear. The first test checks the last hop as behaviour; the third
// reads the source of the other two, because "is this column written and
// selected" is a question the type system cannot answer.
//
// Deleted, the cards go back to `man <slug>` and nobody notices.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { DOC_SUBJECTS } from "../lib/docs.ts"
import { subjectCommand } from "../lib/doc-command.ts"

const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8")

test("every subject card shows the command its subject declares", () => {
  for (const s of DOC_SUBJECTS) {
    // The row exactly as db/seed.ts writes it and lib/content.ts reads it.
    assert.equal(
      subjectCommand({ slug: s.slug, command: s.command }),
      s.command,
      `the "${s.slug}" card would not show its declared "${s.command}"`,
    )
  }
})

test("a subject created from /admin, which has no command, still gets a label", () => {
  // The admin console never sets the column, so its subjects read back NULL.
  assert.equal(subjectCommand({ slug: "robotique", command: null }), "man robotique")
  assert.equal(subjectCommand({ slug: "robotique", command: "" }), "man robotique")
})

test("the seed writes the command and the docs pages read it back", () => {
  const seed = read("db/seed.ts")
  assert.match(seed, /INSERT INTO doc_subjects \([^)]*\bcommand\b/, "db/seed.ts does not insert doc_subjects.command")
  assert.match(seed, /command\s*=\s*EXCLUDED\.command/, "db/seed.ts does not update command on an existing subject")
  assert.match(seed, /\bs\.command\b/, "db/seed.ts does not pass the declared command")
  assert.match(
    read("lib/content.ts"),
    /SELECT [^"]*\bcommand\b[^"]* FROM doc_subjects/,
    "lib/content.ts does not select doc_subjects.command",
  )
  assert.match(read("db/schema.sql"), /doc_subjects ADD COLUMN IF NOT EXISTS command\b/, "db/schema.sql has no command column")
})
