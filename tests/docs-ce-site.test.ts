// The "Ce site, sous le capot" course explains this repository to a student by
// naming its actual files: app/api/pixelwar/stream/route.ts, lib/broadcast.ts,
// app/actions/pixelwar.ts. That is what makes the articles checkable instead of
// hand-wavy — and it is also how they rot.
//
// Rename one of those files and nothing breaks: the build passes, the page
// renders, the sentence is simply false. A doc that lies never alerts. This
// test turns that silent lie into a CI failure.
import { test } from "node:test"
import assert from "node:assert/strict"
import { existsSync } from "node:fs"
import { getSubject, type DocBlock } from "../lib/docs.ts"

const SUBJECT_SLUG = "ce-site"

/**
 * Anything shaped like a repository path: one of the real top-level directories,
 * then a file with a known extension. Deliberately anchored on those directory
 * names so ordinary prose ("un fichier .ts") is not mistaken for a path.
 */
const REPO_PATH = /\b(?:app|lib|components|db|tests|scripts|styles|hooks|gateway)\/[A-Za-z0-9._[\]-]+(?:\/[A-Za-z0-9._[\]-]+)*\.(?:ts|tsx|mjs|sql|css|json|md|yml)\b/g

/** Every string a reader can actually see, across every block type. */
function visibleStrings(block: DocBlock): string[] {
  switch (block.type) {
    case "para":
      return [block.text]
    case "section":
      return [block.text]
    case "code":
      return [block.code, block.label ?? ""]
    case "callout":
      return [block.text, block.title ?? ""]
    case "keylist":
      return block.items.flatMap((i) => [i.term, i.desc])
    case "list":
      return block.items
    case "table":
      return [block.caption ?? "", ...block.headers, ...block.rows.flat()]
    default:
      return []
  }
}

test("the ce-site subject exists and is registered in lib/docs.ts", () => {
  const subject = getSubject(SUBJECT_SLUG)
  assert.ok(
    subject,
    `no subject "${SUBJECT_SLUG}" — lib/docs-ce-site.ts must be imported into DOC_SUBJECTS, or nothing renders`,
  )
  assert.ok(subject.articles.length > 0, "the subject has no articles")
})

test("every repository path quoted in the ce-site course still exists", () => {
  const subject = getSubject(SUBJECT_SLUG)
  assert.ok(subject, `no subject "${SUBJECT_SLUG}"`)

  let checked = 0
  for (const article of subject.articles) {
    const haystack = [article.title, article.summary, ...article.blocks.flatMap(visibleStrings)]
    for (const text of haystack) {
      for (const match of text.matchAll(REPO_PATH)) {
        const path = match[0]
        checked++
        assert.ok(
          existsSync(path),
          `${SUBJECT_SLUG}/${article.slug} points the reader at "${path}", which does not exist — the article is now wrong and nothing else would have said so`,
        )
      }
    }
  }

  // A course that names no file cannot go stale, but it also cannot be checked
  // against the code. The whole point of this subject is that a student can
  // open the file being described.
  assert.ok(checked > 0, "the ce-site course quotes no repository path at all — nothing was verified")
})

test("every ce-site article ends on a 'pour aller plus loin' callout", () => {
  // The layered contract: the body is written for a student with no
  // prerequisites, and the last block names the real mechanism for whoever
  // wants to go read the code. An article missing it silently drops the second
  // audience the subject was written for.
  const subject = getSubject(SUBJECT_SLUG)
  assert.ok(subject, `no subject "${SUBJECT_SLUG}"`)

  for (const article of subject.articles) {
    const last = article.blocks[article.blocks.length - 1]
    assert.ok(last, `${SUBJECT_SLUG}/${article.slug} has no blocks`)
    assert.equal(
      last.type,
      "callout",
      `${SUBJECT_SLUG}/${article.slug} does not end on a callout`,
    )
    assert.match(
      last.type === "callout" ? (last.title ?? "") : "",
      /pour aller plus loin/i,
      `${SUBJECT_SLUG}/${article.slug}: the closing callout must be the "Pour aller plus loin" one`,
    )
  }
})
