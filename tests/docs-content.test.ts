import { test } from "node:test"
import assert from "node:assert/strict"
import { DOC_SUBJECTS, getSubject, type DocBlock } from "../lib/docs.ts"

const BLOCK_TYPES = new Set(["para", "section", "code", "callout", "keylist", "list", "table"])

test("subject slugs are unique", () => {
  const slugs = DOC_SUBJECTS.map((s) => s.slug)
  assert.equal(new Set(slugs).size, slugs.length, "two subjects share a slug — doc_subjects.slug is UNIQUE, the seed would fail")
})

test("article slugs are unique inside their subject", () => {
  for (const s of DOC_SUBJECTS) {
    const slugs = s.articles.map((a) => a.slug)
    assert.equal(
      new Set(slugs).size,
      slugs.length,
      `subject "${s.slug}" has a duplicate article slug — doc_articles is UNIQUE (subject_id, slug), the second one would silently overwrite the first on seed`,
    )
  }
})

test("every block has a type the renderer knows", () => {
  // DocBlocks switches on block.type and `default: return null`. An unknown
  // type is not a crash, it is a block that silently disappears from the page.
  for (const s of DOC_SUBJECTS) {
    for (const a of s.articles) {
      for (const b of a.blocks as DocBlock[]) {
        assert.ok(
          BLOCK_TYPES.has(b.type),
          `${s.slug}/${a.slug}: block type "${b.type}" is not rendered by DocBlocks — it would vanish`,
        )
      }
    }
  }
})

test("every table row has exactly one cell per header", () => {
  // A row shorter or longer than the header row does not crash: the browser
  // just shifts the remaining cells left, or drops them off the right edge. A
  // price lands under the wrong column and the comparison quietly lies.
  for (const s of DOC_SUBJECTS) {
    for (const a of s.articles) {
      for (const b of a.blocks as DocBlock[]) {
        if (b.type !== "table") continue
        assert.ok(b.headers.length > 0, `${s.slug}/${a.slug}: a table has no header row`)
        b.rows.forEach((row, i) => {
          assert.equal(
            row.length,
            b.headers.length,
            `${s.slug}/${a.slug}: table row ${i} has ${row.length} cells for ${b.headers.length} columns — the cells would land under the wrong headers`,
          )
        })
      }
    }
  }
})

test("section ids are unique inside an article", () => {
  // Section ids are anchor targets and feed ArticleToc. Duplicates give two
  // table-of-contents entries that scroll to the same place.
  for (const s of DOC_SUBJECTS) {
    for (const a of s.articles) {
      const ids = (a.blocks as DocBlock[])
        .filter((b): b is Extract<DocBlock, { type: "section" }> => b.type === "section")
        .map((b) => b.id)
      assert.equal(
        new Set(ids).size,
        ids.length,
        `${s.slug}/${a.slug}: duplicate section id — the table of contents would have two entries pointing at the same anchor`,
      )
      for (const id of ids) {
        assert.match(id, /^[a-z0-9-]+$/, `${s.slug}/${a.slug}: section id "${id}" is not a clean anchor slug`)
      }
    }
  }
})

test("the git subject is written, not placeholder", () => {
  const git = getSubject("git")
  assert.ok(git, 'no "git" subject — the Git & GitHub course is missing')
  assert.ok(git.articles.length >= 5, "the Git & GitHub course should be split into articles, not one wall of text")

  // Everything else in lib/docs.ts is still generated lorem. This guards the
  // one subject that holds real course content against being regenerated as a
  // placeholder by accident.
  for (const a of git.articles) {
    const text = JSON.stringify(a.blocks)
    assert.ok(
      !text.includes("contenu d'exemple"),
      `git/${a.slug} still contains placeholder lorem`,
    )
    assert.ok(
      !text.includes("à remplacer"),
      `git/${a.slug} still contains a "à remplacer" placeholder`,
    )
    assert.ok(a.summary.length > 0, `git/${a.slug} has no summary — it is shown on the subject index`)
  }
})

test("every git article opens with prose, not a bare heading", () => {
  const git = getSubject("git")!
  for (const a of git.articles) {
    const first = (a.blocks as DocBlock[])[0]
    assert.equal(first.type, "para", `git/${a.slug} starts with a "${first.type}" block — articles open with a paragraph`)
  }
})

test("written sécurité articles stay real, not placeholder", () => {
  const securite = getSubject("securite")
  assert.ok(securite, 'no "securite" subject')
  for (const slug of ["mots-de-passe", "phishing"]) {
    const article = securite.articles.find((a) => a.slug === slug)
    assert.ok(article, `missing securite/${slug}`)
    const text = JSON.stringify(article.blocks)
    assert.ok(!text.includes("contenu d'exemple"), `securite/${slug} still contains placeholder lorem`)
    assert.ok(!text.includes("à remplacer"), `securite/${slug} still contains a "à remplacer" placeholder`)
    assert.ok(article.summary.length > 0, `securite/${slug} has no summary — it is shown on the subject index`)
  }
})
