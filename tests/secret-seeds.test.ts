// Guards the secret hunt's data: 153 hand-written rows, and no compiler.
//
// One assertion earns the file on its own. The final milestone's `unlockAt` is
// an *absolute count*, so adding one ordinary secret without bumping it makes
// the "you found everything" reward fire while a secret is still missing --
// silently, and only for the first student to get that far. Its neighbour pins
// the hint text, because the hint spells that number out in prose and prose
// does not fail a build.
//
// The rest is a catalogue of ways a data file breaks without breaking
// anything: a lower-case code that can never be redeemed (redeemSecret
// compares upper(code)), a badge slug no badge seed defines (awardBadge logs
// and returns false, so the student redeems and silently gets nothing else), a
// category nobody mapped (it lands in AUTRE, a bucket nobody clicks).
//
// The last two tests are editorial rather than technical, and they are the
// unusual ones here: a secret whose name contains its own answer is not
// broken, it simply has nothing left to find. That is still a defect, and it
// is cheaper to catch here than in a classroom.
//
// Deleted, the seed keeps loading. Every failure above reaches a student
// before it reaches anyone who could fix it.
import { test } from "node:test"
import assert from "node:assert/strict"
import { SECRET_SEEDS } from "../db/seeds/secrets.ts"
import { BADGE_SEEDS } from "../db/seeds/badges.ts"
import { SECRET_FAMILIES, familyOf } from "../lib/secret-taxonomy.ts"

const DIFFICULTIES = new Set(["easy", "medium", "hard", "insane"])
const ordinary = SECRET_SEEDS.filter((s) => s.unlockAt === undefined)
const milestones = SECRET_SEEDS.filter((s) => s.unlockAt !== undefined)

test("codes are unique", () => {
  const codes = SECRET_SEEDS.map((s) => s.code)
  const dupes = codes.filter((c, i) => codes.indexOf(c) !== i)
  assert.deepEqual(dupes, [], "duplicate secret code — `secrets.code` is UNIQUE, the second row would overwrite the first on seed")
})

test("codes are upper-case and typeable", () => {
  // redeemSecret compares `upper(code)`, and the hunt input force-uppercases.
  // A lower-case or space-bearing seed code could never be redeemed.
  for (const s of SECRET_SEEDS) {
    assert.equal(s.code, s.code.toUpperCase(), `${s.code} is not upper-case`)
    assert.match(s.code, /^[A-Z0-9-]+$/, `${s.code} has characters a student cannot type into the code box`)
  }
})

test("the eight original secrets survive", () => {
  // Students have already redeemed some of these. Renaming or dropping a code
  // orphans nothing in the DB (redemptions key on the row id) but does break
  // whatever is physically hidden in the site and on any printed handout.
  for (const code of [
    "SIN-KONAMI", "SIN-SOURCE", "SIN-ROBOTS", "SIN-TERMINAL",
    "SIN-404", "SIN-CONSOLE", "SIN-PROF", "SIN-LEGENDE",
  ]) {
    assert.ok(
      SECRET_SEEDS.some((s) => s.code === code),
      `${code} disappeared — it is hidden in the live site and may already be redeemed`,
    )
  }
})

test("every badge referenced by a secret exists", () => {
  // awardBadge() logs and returns false for an unknown slug: the student
  // redeems, gets `hunter`, and silently gets nothing else. This has happened
  // on this project before (the badge called "jeu"/"Jeu").
  const slugs = new Set(BADGE_SEEDS.map((b) => b.slug))
  for (const s of SECRET_SEEDS) {
    if (!s.badgeSlug) continue
    assert.ok(slugs.has(s.badgeSlug), `${s.code} awards badge "${s.badgeSlug}", which no badge seed defines`)
  }
})

test("every difficulty is one the UI can filter on", () => {
  for (const s of SECRET_SEEDS) {
    assert.ok(DIFFICULTIES.has(s.difficulty), `${s.code} has difficulty "${s.difficulty}"`)
  }
})

test("every category maps to a family", () => {
  // 46 raw categories, 24 of them with a single member, are not a usable
  // filter. The board groups them into families; an unmapped category falls
  // into AUTRE, which is a bucket nobody clicks.
  for (const s of SECRET_SEEDS) {
    assert.notEqual(
      familyOf(s.category),
      "AUTRE",
      `category "${s.category}" (${s.code}) is not mapped in SECRET_FAMILIES and would land in the catch-all`,
    )
  }
})

test("every declared family is actually used", () => {
  // A family with no secrets renders an empty filter chip.
  for (const key of Object.keys(SECRET_FAMILIES)) {
    if (key === "AUTRE") continue
    assert.ok(
      SECRET_SEEDS.some((s) => familyOf(s.category) === key),
      `family "${key}" has no secrets — it would render a filter chip that matches nothing`,
    )
  }
})

test("there are exactly four milestones", () => {
  assert.equal(milestones.length, 4)
  assert.deepEqual(
    milestones.map((m) => m.code).sort(),
    ["SIN-100-UNLOCK", "SIN-FINAL-BOSS-ULTIMATE", "SIN-FIRST-UNLOCK", "SIN-LEGENDE"],
  )
})

test("the final milestone unlocks at exactly the number of ordinary secrets", () => {
  // This is the assertion that earns its keep. `unlockAt` is an absolute count,
  // so adding one ordinary secret without bumping the final milestone makes the
  // "you found everything" reward fire while one secret is still missing —
  // silently, and only for the first student to get that far.
  const boss = SECRET_SEEDS.find((s) => s.code === "SIN-FINAL-BOSS-ULTIMATE")!
  assert.equal(
    boss.unlockAt,
    ordinary.length,
    `SIN-FINAL-BOSS-ULTIMATE unlocks at ${boss.unlockAt} but there are ${ordinary.length} ordinary secrets — ` +
      "bump unlockAt (and the hint, which names the number) whenever you add or remove one",
  )
})

test("the final milestone's hint names the right number", () => {
  // The hint says "les 149 autres". If the count moves and the hint does not,
  // the page tells students a number the game does not use.
  const boss = SECRET_SEEDS.find((s) => s.code === "SIN-FINAL-BOSS-ULTIMATE")!
  assert.ok(
    boss.hint.includes(String(ordinary.length)),
    `the final milestone's hint does not mention ${ordinary.length}: "${boss.hint}"`,
  )
})

test("no milestone gate is out of reach", () => {
  for (const m of milestones) {
    assert.ok(
      m.unlockAt! <= ordinary.length,
      `${m.code} unlocks at ${m.unlockAt}, but only ${ordinary.length} ordinary secrets exist — unreachable`,
    )
    assert.ok(m.unlockAt! > 0, `${m.code} unlocks at ${m.unlockAt}, which every student satisfies immediately`)
  }
})

test("milestones say so in their location, and ordinary secrets do not", () => {
  for (const s of SECRET_SEEDS) {
    const claimsAuto = s.location.startsWith("Palier automatique")
    assert.equal(
      claimsAuto,
      s.unlockAt !== undefined,
      `${s.code}: location and unlockAt disagree about whether this is a milestone`,
    )
  }
})

test("no hint promises a vulnerability the site does not have", () => {
  // Group B of the operator's list described real attacks (/.git/ exposed, SQL
  // injection, ../../../etc/passwd, an SSH private key). Those are knowledge
  // questions here — the site is not going to be made injectable so a student
  // can score 50 points, and a hint that says otherwise sends a classroom
  // attacking a live site that serves minors.
  const knowledge = SECRET_SEEDS.filter((s) => s.location.startsWith("Connaissance"))
  assert.ok(knowledge.length >= 7, "the dangerous-by-description secrets lost their knowledge-only marking")
  for (const s of knowledge) {
    assert.ok(
      !/^\/|\.\.\/|BEGIN RSA|' OR '/.test(s.hint),
      `${s.code}'s hint still reads as an instruction to attack the site: "${s.hint}"`,
    )
  }
})

test("un secret encore à cacher dit quoi cacher et où", () => {
  // This floor has only ever gone down, and only when a secret was genuinely
  // placed somewhere: 12 → 11 on 2026-09-07 when SIN-DEBUG-PARAM became real
  // behind /vie?debug=true, then **11 → 0** on 2026-09-08 when the last eleven
  // were placed for good (lib/secret-placements.ts). The count is therefore at
  // zero, and tests/secret-placements.test.ts now holds the strong invariant:
  // no secret promises a hiding place that does not exist.
  //
  // What is still checked here is for the next one: if someone puts a marker
  // back, it has to say what to hide and where, not just "to do".
  const todo = SECRET_SEEDS.filter((s) => s.location.startsWith("À IMPLÉMENTER"))
  for (const s of todo) {
    assert.ok(s.location.includes("—"), `${s.code} dit À IMPLÉMENTER sans dire quoi cacher ni où`)
  }
})

test("the whole set is the size the design settled on", () => {
  assert.equal(SECRET_SEEDS.length, 153, "153 = 8 original + 145 genuinely new (5 of the 150 merged into existing codes)")
  assert.equal(ordinary.length, 149)
})

// Measured on 2026-09-08 against the production database: 37 secrets out of
// 160 had the answer written into their own name, so there was nothing to look
// for — you just copied the title back. The 26 general-knowledge secrets
// concerned were rewritten; this test stops the next one coming back.
// `lib/secrets-yaml.ts` applies the same rule to the private file, so the two
// sources of secrets hold to it alike.
//
// The `SIN-*` codes are exempt on purpose: their name describes *where to look
// in the site* (« Message dans la console », « Vue sur la source »), which is
// precisely its job. What gives those away is the regularity of the prefix,
// not their name.
test("le nom d'un secret ne contient pas sa propre réponse", () => {
  const words = (text: string) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean)

  const contains = (haystack: string[], needle: string[]) =>
    needle.length > 0 &&
    needle.length <= haystack.length &&
    haystack.some((_, i) => needle.every((w, j) => haystack[i + j] === w))

  const offenders = SECRET_SEEDS.filter(
    (s) => !s.code.startsWith("SIN-") && contains(words(s.name), words(s.code)),
  ).map((s) => `${s.code} → « ${s.name} »`)

  assert.deepEqual(
    offenders,
    [],
    "le nom donne la réponse : décris le secret sans le nommer, sinon il n'y a rien à chercher",
  )
})

// The scale was cut down to four values on 2026-09-08 (it had fourteen). Two
// exceptions are deliberate jokes, documented here rather than tolerated in
// silence.
test("les points d'un secret ordinaire découlent de sa difficulté", () => {
  const SCALE: Record<string, number> = { easy: 10, medium: 20, hard: 30, insane: 50 }
  const JOKES = new Set(["NICE-NUMBER", "CHICKEN-JOKE"])

  for (const s of SECRET_SEEDS) {
    if (s.unlockAt !== undefined || JOKES.has(s.code)) continue
    assert.equal(
      s.points,
      SCALE[s.difficulty],
      `${s.code} vaut ${s.points} points pour une difficulté « ${s.difficulty} » (attendu ${SCALE[s.difficulty]})`,
    )
  }
})
