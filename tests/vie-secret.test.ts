import { test } from "node:test"
import assert from "node:assert/strict"
import { SECRET_SEEDS } from "../db/seeds/secrets.ts"
import { VIE_SECRET_CODE } from "../lib/vie-secret.ts"

test("the code shown by /vie?debug=true is a real, redeemable secret", () => {
  // The page renders a string; /chasse validates against the seeds. Nothing
  // connects the two at runtime, so a rename on either side leaves a student
  // typing a code that is simply rejected, with no way to tell it was our bug.
  const seed = SECRET_SEEDS.find((s) => s.code === VIE_SECRET_CODE)
  assert.ok(seed, `/vie shows "${VIE_SECRET_CODE}", which no secret in the seeds has`)
})

test("the secret hidden on /vie is no longer marked as unimplemented", () => {
  const seed = SECRET_SEEDS.find((s) => s.code === VIE_SECRET_CODE)!
  assert.ok(
    !seed.location.startsWith("À IMPLÉMENTER"),
    "the code is on /vie now, but its location still tells the operator to hide it somewhere",
  )
  assert.ok(
    seed.location.includes("/vie"),
    `the admin-only location does not say where the code is: "${seed.location}"`,
  )
})
