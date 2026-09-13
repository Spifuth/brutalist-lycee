// Guards the reward gates of the secret hunt: which ones a given count has
// earned, and what counts as a gate at all.
//
// milestonesReached() returns every gate at or below the count, not just the
// one just crossed, which is what lets app/actions/engage.ts stay correct when
// a count jumps (an import, an admin edit) instead of owing the student future
// redemptions. Cumulative-by-default is the safer shape whenever the trigger
// is a threshold rather than an event.
//
// isMilestone() is the half with a trap in it. `unlock_at` is a nullable
// INTEGER, so pg hands back `null` while the seed type uses `undefined`; both
// mean "an ordinary secret" and both have to be treated alike. Get it wrong in
// that direction and redeemSecret refuses every ordinary code, since it
// refuses anything a milestone -- loud, immediate, and every student at once.
// Any value crossing a database boundary has two spellings of absent.
//
// Deleted, nothing throws at seed or build time; the gates simply start firing
// at the wrong counts.
import { test } from "node:test"
import assert from "node:assert/strict"
import { milestonesReached, isMilestone } from "../lib/milestones.ts"

// Shape mirrors the rows redeemSecret reads out of `secrets`.
const GATES = [
  { code: "SIN-LEGENDE", unlockAt: 50 },
  { code: "SIN-FIRST-UNLOCK", unlockAt: 50 },
  { code: "SIN-100-UNLOCK", unlockAt: 100 },
  { code: "SIN-FINAL-BOSS-ULTIMATE", unlockAt: 149 },
]

test("nothing is granted before the first gate", () => {
  assert.deepEqual(milestonesReached(0, GATES), [])
  assert.deepEqual(milestonesReached(49, GATES), [])
})

test("both 50-gates fire together, on the 50th secret and not the 49th", () => {
  assert.deepEqual(milestonesReached(50, GATES).sort(), ["SIN-FIRST-UNLOCK", "SIN-LEGENDE"])
})

test("gates are cumulative, not one-at-a-time", () => {
  // A student who imports 120 finds at once (or whose count is recomputed after
  // an admin edit) must not be owed three separate future redemptions.
  assert.deepEqual(
    milestonesReached(120, GATES).sort(),
    ["SIN-100-UNLOCK", "SIN-FIRST-UNLOCK", "SIN-LEGENDE"],
  )
})

test("the final gate needs every ordinary secret", () => {
  assert.ok(!milestonesReached(148, GATES).includes("SIN-FINAL-BOSS-ULTIMATE"))
  assert.deepEqual(milestonesReached(149, GATES).length, 4)
})

test("a count above the last gate grants everything and nothing more", () => {
  assert.equal(milestonesReached(500, GATES).length, GATES.length)
})

test("a milestone row is recognised whatever the shape of its unlock_at", () => {
  // The DB column is nullable INTEGER; pg hands back `null`, the seed type uses
  // `undefined`. Both mean "ordinary secret" and both must be treated alike, or
  // redeemSecret would refuse an ordinary code as if it were a milestone.
  assert.equal(isMilestone({ unlockAt: 50 }), true)
  assert.equal(isMilestone({ unlockAt: null }), false)
  assert.equal(isMilestone({ unlockAt: undefined }), false)
  assert.equal(isMilestone({}), false)
  // 0 would mean "granted to everyone immediately", which is not a milestone
  // anyone should be able to configure by leaving the admin field blank.
  assert.equal(isMilestone({ unlockAt: 0 }), false)
})
