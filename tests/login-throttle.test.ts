import { test } from "node:test"
import assert from "node:assert/strict"
import {
  checkLogin,
  recordFailure,
  clearFailures,
  MAX_FAILURES,
  WINDOW_MS,
  MAX_TRACKED,
  _reset,
  _size,
} from "../lib/login-throttle.ts"

const T0 = 1_700_000_000_000

test("a few wrong tries are allowed", () => {
  _reset()
  for (let i = 0; i < MAX_FAILURES - 1; i++) recordFailure("eleve", T0 + i)
  assert.equal(checkLogin("eleve", T0 + 100).allowed, true)
})

test("the ceiling refuses, and says how long to wait", () => {
  _reset()
  for (let i = 0; i < MAX_FAILURES; i++) recordFailure("eleve", T0 + i)
  const res = checkLogin("eleve", T0 + 100)
  assert.equal(res.allowed, false)
  assert.ok(res.retryAfterMs > 0 && res.retryAfterMs <= WINDOW_MS, `retryAfterMs is ${res.retryAfterMs}`)
})

test("failures are forgotten once the window has passed", () => {
  _reset()
  for (let i = 0; i < MAX_FAILURES; i++) recordFailure("eleve", T0 + i)
  assert.equal(checkLogin("eleve", T0 + 100).allowed, false)
  assert.equal(checkLogin("eleve", T0 + WINDOW_MS + 1).allowed, true, "an old failure still counts — the lock is permanent")
})

test("a successful login wipes the slate", () => {
  _reset()
  for (let i = 0; i < MAX_FAILURES; i++) recordFailure("eleve", T0 + i)
  clearFailures("eleve")
  assert.equal(checkLogin("eleve", T0 + 100).allowed, true)
})

test("one pseudo cannot lock out another", () => {
  // The reason this is keyed on the pseudo and NOT on the IP: thirty students
  // in a classroom share one public address. A per-IP limit is a correct rate
  // limit and the wrong one here — one student fat-fingering their passphrase
  // would lock out the whole room mid-session.
  _reset()
  for (let i = 0; i < MAX_FAILURES * 3; i++) recordFailure("eleve-a", T0 + i)
  assert.equal(checkLogin("eleve-a", T0 + 100).allowed, false)
  assert.equal(checkLogin("eleve-b", T0 + 100).allowed, true, "a second student was caught by the first one's failures")
})

test("the key is case-insensitive, like the login lookup", () => {
  // login() matches on pseudo_lower. If the throttle keyed on the raw input,
  // alternating "Eleve" and "eleve" would double the allowance for free.
  _reset()
  for (let i = 0; i < MAX_FAILURES; i++) recordFailure("Eleve", T0 + i)
  assert.equal(checkLogin("eleve", T0 + 100).allowed, false, "changing the case escaped the throttle")
})

test("spraying unique pseudos cannot grow memory without bound", () => {
  // The key is attacker-controlled. An unbounded Map keyed on it is a memory
  // exhaustion vector that the throttle would have introduced itself.
  _reset()
  for (let i = 0; i < MAX_TRACKED * 3; i++) recordFailure(`inconnu-${i}`, T0 + i)
  assert.ok(_size() <= MAX_TRACKED, `the throttle is tracking ${_size()} keys, above the ${MAX_TRACKED} cap`)
})

test("an attacker gets far fewer tries per day than the passphrase space", () => {
  // The number that makes this worth having: 10 tries per 15 minutes is 960 a
  // day against a space of 2.7e12. Written as a test so a future edit that
  // loosens the constants has to face the arithmetic.
  const perDay = MAX_FAILURES * ((24 * 60 * 60 * 1000) / WINDOW_MS)
  assert.ok(perDay < 5000, `the throttle allows ${perDay} guesses per day per account`)
})
