import { test } from "node:test"
import assert from "node:assert/strict"
import { BADGE_MAP, ORPHAN_BADGES } from "../lib/migration/badge-map.ts"
import { resolveCollisions } from "../lib/migration/collisions.ts"

test("every old badge id resolves to a new slug", () => {
  const OLD = ["bienvenue","bavard","coquet","curieux","premier-quiz","score-parfait",
    "pinceau-fou","explorateur","encyclopediste","supporter","marathonien",
    "perfectionniste","polyvalent","vieux-gamer","causeur","citoyen","insomniaque","matinal"]
  for (const id of OLD) {
    assert.ok(BADGE_MAP[id], `no mapping for old badge "${id}" — 106 unlocks depend on this being total`)
  }
})

test("the eight orphans are all created", () => {
  const slugs = ORPHAN_BADGES.map((b) => b.slug)
  for (const s of ["coquet","pinceau-fou","marathonien","perfectionniste",
                   "polyvalent","vieux-gamer","citoyen","matinal"]) {
    assert.ok(slugs.includes(s), `orphan badge "${s}" is not created`)
  }
})

test("the two avatar badges are earnable, the rest are inert", () => {
  const byslug = Object.fromEntries(ORPHAN_BADGES.map((b) => [b.slug, b]))
  assert.equal(byslug["coquet"].kind, "auto:avatar")
  assert.equal(byslug["pinceau-fou"].kind, "auto:avatar")
  assert.equal(byslug["citoyen"].kind, "manual")
})

test("a case collision keeps the earlier account and drops the later", () => {
  const r = resolveCollisions([
    { pseudo: "Legeek38", createdAt: new Date("2026-05-26T08:00:00Z") },
    { pseudo: "legeek38", createdAt: new Date("2026-06-04T12:01:00Z") },
    { pseudo: "AnyChan",  createdAt: new Date("2026-05-27T21:21:00Z") },
  ])
  assert.deepEqual(r.drop, ["legeek38"])
  assert.ok(r.keep.includes("Legeek38"))
  assert.ok(r.keep.includes("AnyChan"))
})

test("collisions are detected generally, not hardcoded to legeek38", () => {
  const r = resolveCollisions([
    { pseudo: "Zoe", createdAt: new Date("2026-01-01") },
    { pseudo: "ZOE", createdAt: new Date("2026-02-01") },
  ])
  assert.deepEqual(r.drop, ["ZOE"])
})

test("no collision means nothing is dropped", () => {
  const r = resolveCollisions([
    { pseudo: "a", createdAt: new Date("2026-01-01") },
    { pseudo: "b", createdAt: new Date("2026-02-01") },
  ])
  assert.deepEqual(r.drop, [])
})
