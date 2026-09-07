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
