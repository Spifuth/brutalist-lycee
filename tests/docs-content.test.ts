import { test } from "node:test"
import assert from "node:assert/strict"
import { DOC_SUBJECTS, getSubject, type DocBlock } from "../lib/docs.ts"
import { buildPruneKeys } from "../lib/docs-prune-keys.ts"

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

test("subject and article slugs are clean URL segments", () => {
  // Slugs are literal Next.js route segments (app/docs/[subject]/[article])
  // and the prune's composite key in db/seed.ts is `s.slug + "/" + a.slug`. A
  // slug containing a "/" would make subject "a/b" + article "c" collide with
  // subject "a" + article "b/c" — an ambiguous prune key on top of a broken URL.
  for (const s of DOC_SUBJECTS) {
    assert.match(s.slug, /^[a-z0-9-]+$/, `subject "${s.slug}" is not a clean URL segment — it would break its route and could collide with another subject/article pair in the seed's prune key`)
    for (const a of s.articles) {
      assert.match(
        a.slug,
        /^[a-z0-9-]+$/,
        `${s.slug}/${a.slug}: article slug is not a clean URL segment — it would break its route and could collide with another subject/article pair in the seed's prune key`,
      )
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

test("the reseaux subject is written, not placeholder", () => {
  const reseaux = getSubject("reseaux")
  assert.ok(reseaux, 'no "reseaux" subject — the networks course is missing')
  assert.ok(reseaux.articles.length >= 2, "the réseaux course should include at least two real articles")

  for (const a of reseaux.articles) {
    const text = JSON.stringify(a.blocks)
    assert.ok(
      !text.includes("contenu d'exemple"),
      `reseaux/${a.slug} still contains placeholder lorem`,
    )
    assert.ok(
      !text.includes("à remplacer"),
      `reseaux/${a.slug} still contains a "à remplacer" placeholder`,
    )
    assert.ok(a.summary.length > 0, `reseaux/${a.slug} has no summary — it is shown on the subject index`)
  }
})

test("every reseaux article opens with prose, not a bare heading", () => {
  const reseaux = getSubject("reseaux")!
  for (const a of reseaux.articles) {
    const first = (a.blocks as DocBlock[])[0]
    assert.equal(first.type, "para", `reseaux/${a.slug} starts with a "${first.type}" block — articles open with a paragraph`)
  }
})

test("the comptes subject is written, not placeholder", () => {
  const comptes = getSubject("comptes")
  assert.ok(comptes, 'no "comptes" subject — the accounts & identity course is missing')

  for (const a of comptes.articles) {
    const text = JSON.stringify(a.blocks)
    assert.ok(
      !text.includes("contenu d'exemple"),
      `comptes/${a.slug} still contains placeholder lorem`,
    )
    assert.ok(
      !text.includes("à remplacer"),
      `comptes/${a.slug} still contains a "à remplacer" placeholder`,
    )
    assert.ok(a.summary.length > 0, `comptes/${a.slug} has no summary — it is shown on the subject index`)
  }
})

test("every comptes article opens with prose, not a bare heading", () => {
  const comptes = getSubject("comptes")!
  for (const a of comptes.articles) {
    const first = (a.blocks as DocBlock[])[0]
    assert.equal(first.type, "para", `comptes/${a.slug} starts with a "${first.type}" block — articles open with a paragraph`)
  }
})

// A Discord token is either three base64url segments separated by dots
// (id.timestamp.signature), or an "mfa." prefix followed by one long segment
// — the form issued to accounts that have 2FA enabled. Committing a real one
// would leak an account; committing a realistic-looking one teaches readers
// to treat the shape as harmless. Examples must stay obviously fake.

// The previous version of this guard excused a match by stripping redaction
// markers (EXEMPLE, FACTICE, XXXX) out of it and re-testing the remainder
// against the shape, treating the match as "redacted enough" once stripping
// broke the shape. That rule was holed twice: dropping a marker into the
// short middle segment (the timestamp — the part nobody actually cares
// about) is enough to break the shape on its own, while the account id and
// the signature on either side of it — the two segments that actually
// matter — sit there completely real and untouched. Every patch to that rule
// (require the marker span a whole segment, require every segment carry one,
// ...) only relocates the hole, because "is this specific match redacted
// enough to be safe?" is not a question a shape-based heuristic can answer.
//
// So: no heuristic. Every deliberate example token used in the course is
// listed here, byte-for-byte. Adding a new fake token to the course now
// requires deliberately adding it to this set — that human checkpoint is the
// feature, not friction: a person looking at one specific new string and
// deciding "yes, this one is genuinely fake" is a judgment call a regex can
// never make correctly.
const KNOWN_FAKE_TOKENS = new Set([
  "MTE0NTE0MTkxOTgxMDAwMDAw.XXXXXX.EXEMPLE-FACTICE-NE-FONCTIONNE-PAS",
])

function looksLikeRealToken(s: string): boolean {
  const SHAPE = /mfa\.[A-Za-z0-9_-]{20,}|[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{20,}/g
  for (const m of s.matchAll(SHAPE)) {
    if (!KNOWN_FAKE_TOKENS.has(m[0])) return true
  }
  return false
}

test("the token guard recognises a credential-shaped string", () => {
  // Prove the guard can fail before trusting it on real content.
  assert.equal(
    looksLikeRealToken("MTE0NTE0MTkxOTgxMDAwMDAw.Gh3kQz.9pLmNxQwErTyUiOpAsDfGhJkLzXcVb"),
    true,
    "the guard does not recognise a plain three-segment credential shape — it would never fire",
  )
  assert.equal(
    looksLikeRealToken("MTE0NTE0MTkxOTgxMDAwMDAw.Gh3kQz.9pLmNxQwXXXXUiOpAsDfGhJkLzXcVb"),
    true,
    "a marker sprinkled into an otherwise real signature is not a known fake token — the allowlist correctly refuses to excuse anything but an exact match",
  )
  assert.equal(
    looksLikeRealToken("MTE0NTE0MTkxOTgxMDAwMDAw.XXXXX.9pLmNxQwErTyUiOpAsDfGhJkLzXcVb"),
    true,
    "this is the hole the old marker-stripping rule left open: redacting only the middle (timestamp) segment leaves the account id and the signature — the two segments that actually matter — completely real and unmodified; an allowlist that only excuses an exact known string correctly still flags this",
  )
  assert.equal(
    looksLikeRealToken("mfa.9pLmNxQwErTyUiOpAsDfGhJkLzXcVbQwErTyUiOpAsDfGh"),
    true,
    "the guard misses the mfa.-prefixed token format issued to 2FA-enabled accounts",
  )
  assert.equal(
    looksLikeRealToken(
      "Voici mon jeton, ne le partage à personne : MTE0NTE0MTkxOTgxMDAwMDAw.Gh3kQz.9pLmNxQwErTyUiOpAsDfGhJkLzXcVb — merci.",
    ),
    true,
    "a credential-shaped string embedded in surrounding prose must still be caught — the walk over para/callout text depends on matching inside a larger string, not just testing the whole string against the shape",
  )
  assert.equal(
    looksLikeRealToken("MTE0NTE0MTkxOTgxMDAwMDAw.XXXXXX.EXEMPLE-FACTICE-NE-FONCTIONNE-PAS"),
    false,
    "the pinned example token from lib/docs-comptes.ts must stay excused — it is the article's deliberate teaching example, and the article cannot ship if the guard blocks it",
  )
})

// Recursively collects every string value nested inside a block, instead of
// enumerating each block type's string fields by hand (para.text, section.text,
// code.code/label, callout.text/title, keylist.items[].term/desc, list.items[],
// table.caption/headers/rows...). A generic walk is more brittle-proof than a
// field list: it keeps covering new block types, and new string fields on
// existing ones, without this test needing an update when lib/docs.ts grows.
function collectStrings(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value)
  } else if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out)
  } else if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectStrings(v, out)
  }
}

test("no credential-shaped string is committed in the docs", () => {
  for (const s of DOC_SUBJECTS) {
    for (const a of s.articles) {
      for (const b of a.blocks as DocBlock[]) {
        const strings: string[] = []
        collectStrings(b, strings)
        for (const str of strings) {
          assert.equal(
            looksLikeRealToken(str),
            false,
            `${s.slug}/${a.slug}: a block contains a string shaped like a real token, with no redaction marker — never commit a credential, even an expired one`,
          )
        }
      }
    }
  }
})

test("the comptes subject covers the whole identity chain", () => {
  // The subject is one argument in five steps: you prove once (preuve), the
  // password is not enough (mot-de-passe), 2FA guards the door (deux-facteurs),
  // the token walks past the door (jeton-discord), passkeys fix the door but
  // not the room (passkeys). Drop one and the argument stops landing.
  const comptes = getSubject("comptes")!
  const expected = ["preuve", "mot-de-passe", "deux-facteurs", "jeton-discord", "passkeys"]
  assert.deepEqual(
    comptes.articles.map((a) => a.slug),
    expected,
    "the comptes articles are missing, renamed or out of order — the chain only reads in this sequence",
  )
})

// db/seed.ts's prune is the most destructive code on this branch: it deletes
// any doc_subjects/doc_articles row the seed doesn't recognise. buildPruneKeys
// holds its key-building and its two refusals — guard them here, against a
// database-free pure function, not against DOC_SUBJECTS (which never happens
// to be empty or article-less, so a bug in the guards would never fail here
// via the tests above).

test("buildPruneKeys: normal input produces subject slugs and subject/article keys", () => {
  const result = buildPruneKeys([
    { slug: "a", articles: [{ slug: "one" }, { slug: "two" }] },
    { slug: "b", articles: [{ slug: "three" }] },
  ])
  assert.deepEqual(result.subjectSlugs, ["a", "b"])
  assert.deepEqual(result.articleKeys, ["a/one", "a/two", "b/three"])
})

test("buildPruneKeys: an empty subjects array throws", () => {
  assert.throws(() => buildPruneKeys([]), /DOC_SUBJECTS is empty/)
})

test("buildPruneKeys: subjects present but every subject's articles are empty throws", () => {
  assert.throws(
    () => buildPruneKeys([
      { slug: "a", articles: [] },
      { slug: "b", articles: [] },
    ]),
    /declares no articles at all/,
  )
})

test("buildPruneKeys: a single subject with zero articles alongside others does not throw", () => {
  const result = buildPruneKeys([
    { slug: "a", articles: [] },
    { slug: "b", articles: [{ slug: "one" }] },
  ])
  assert.deepEqual(result.subjectSlugs, ["a", "b"])
  assert.deepEqual(result.articleKeys, ["b/one"])
})

test("the retired securite placeholders are gone", () => {
  // "Mots de passe solides" and "Double authentification" were lorem. Their
  // subject is now written in the comptes course; leaving the placeholders in
  // Sécurité sends a student to fake content while the real one exists.
  const securite = getSubject("securite")!
  const slugs = securite.articles.map((a) => a.slug)
  for (const retired of ["mots-de-passe", "2fa"]) {
    assert.ok(
      !slugs.includes(retired),
      `securite/${retired} is back — that topic is written in the comptes subject, this placeholder duplicates it`,
    )
  }
  assert.ok(
    slugs.includes("gestionnaires"),
    "securite/gestionnaires was removed — it is written content and its URL is live; it stays where it is",
  )
})
