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

test("secrets that still need hiding are marked for the operator", () => {
  const todo = SECRET_SEEDS.filter((s) => s.location.startsWith("À IMPLÉMENTER"))
  assert.ok(todo.length >= 12, "the not-yet-hidden secrets lost their À IMPLÉMENTER marking")
  for (const s of todo) {
    assert.ok(s.location.includes("—"), `${s.code} says À IMPLÉMENTER without saying what to hide where`)
  }
})

test("the whole set is the size the design settled on", () => {
  assert.equal(SECRET_SEEDS.length, 153, "153 = 8 original + 145 genuinely new (5 of the 150 merged into existing codes)")
  assert.equal(ordinary.length, 149)
})
