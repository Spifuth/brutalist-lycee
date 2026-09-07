import { test } from "node:test"
import assert from "node:assert/strict"
import {
  analyse,
  crackSeconds,
  humaniseDuration,
  ATTACKERS,
  ASSUMED_DICTIONARY_SIZE,
} from "../lib/password-strength.ts"

const gpu = ATTACKERS.find((a) => a.key === "gpu")!.guessesPerSecond

test("a longer random password is always harder than a shorter one", () => {
  const short = analyse("kJ8vQ2")
  const long = analyse("kJ8vQ2mR7pXz")
  assert.ok(long.guesses > short.guesses, "length stopped mattering")
})

test("the most common passwords are found immediately, whatever their shape", () => {
  // "azerty" is six characters of mixed-case-free lowercase — brute force says
  // 300 million tries. A real attacker opens a list and finds it first.
  for (const pw of ["azerty", "123456", "motdepasse", "password"]) {
    const a = analyse(pw)
    assert.ok(
      crackSeconds(a, gpu) < 1,
      `"${pw}" is presented as taking ${humaniseDuration(crackSeconds(a, gpu))} — it is in every wordlist`,
    )
    assert.ok(
      a.weaknesses.some((w) => w.kind === "commun"),
      `"${pw}" was not reported as a common password`,
    )
  }
})

test("leetspeak does not rescue a common password", () => {
  // This is the single most widespread false belief about passwords: that
  // swapping a for @ makes a dictionary word safe. Cracking tools apply those
  // substitutions before they even start.
  const plain = analyse("password")
  const leet = analyse("P@ssw0rd")
  assert.ok(
    leet.guesses <= plain.guesses * 100,
    `"P@ssw0rd" is rated ${leet.guesses / plain.guesses}x stronger than "password" — substitutions are not a defence`,
  )
  assert.ok(leet.weaknesses.some((w) => w.kind === "substitution"))
})

test("a keyboard run is not random, however long it is", () => {
  const a = analyse("azertyuiop")
  assert.ok(a.weaknesses.some((w) => w.kind === "suite-clavier"), "the keyboard run was not spotted")
  assert.ok(crackSeconds(a, gpu) < 60)
})

test("repeating one character does not build entropy", () => {
  const a = analyse("aaaaaaaaaaaa")
  assert.ok(a.weaknesses.some((w) => w.kind === "repetition"))
  assert.ok(crackSeconds(a, gpu) < 1)
})

test("a year at the end is nearly free for the attacker", () => {
  const bare = analyse("chateau")
  const dated = analyse("chateau2024")
  assert.ok(dated.weaknesses.some((w) => w.kind === "annee"), "the trailing year was not spotted")
  // Four digits look like 10 000 extra tries; a year is one of about a hundred.
  assert.ok(dated.guesses < bare.guesses * 1000, "a trailing year was priced as if it were random digits")
})

test("THE LESSON: a four-word passphrase beats a short complicated password", () => {
  // Everything on this page exists to make this one comparison visible. An
  // implementation that gets it backwards still prints a confident number and
  // still animates a counter — this is the assertion that catches it.
  const complicated = analyse("P@ssw0rd!")
  const passphrase = analyse("orage-cobalt-ardoise-prisme")
  assert.ok(
    passphrase.guesses > complicated.guesses * 1e6,
    `the passphrase is only ${(passphrase.guesses / complicated.guesses).toExponential(1)}x harder — the page would teach the opposite of the truth`,
  )
  assert.ok(crackSeconds(passphrase, gpu) > 60 * 60 * 24 * 365, "the passphrase falls in under a year on a GPU")
})

test("a passphrase is priced against a real dictionary, not our own short list", () => {
  // The detector only knows a few hundred French words; a real attacker uses
  // tens of thousands. Pricing four words at (our list size)^4 would invent a
  // weakness that is an artefact of this file being small.
  const a = analyse("orage-cobalt-ardoise-prisme")
  assert.ok(
    a.guesses >= Math.pow(ASSUMED_DICTIONARY_SIZE, 4) / 10,
    "four dictionary words were priced below the assumed dictionary size",
  )
})

test("attacker speed is the only thing that changes between profiles", () => {
  const a = analyse("kJ8vQ2mR7pXz")
  const slow = crackSeconds(a, 1e4)
  const fast = crackSeconds(a, 1e10)
  assert.ok(Math.abs(slow / fast - 1e6) < 1, "the profiles do not scale linearly with guess rate")
})

test("nothing produces NaN, Infinity or a negative duration", () => {
  for (const pw of ["", "a", "🔐🔐🔐", "é".repeat(200), " ", "-".repeat(40)]) {
    const a = analyse(pw)
    assert.ok(Number.isFinite(a.guesses) && a.guesses >= 0, `guesses is ${a.guesses} for ${JSON.stringify(pw)}`)
    for (const at of ATTACKERS) {
      const s = crackSeconds(a, at.guessesPerSecond)
      assert.ok(Number.isFinite(s) && s >= 0, `crackSeconds is ${s} for ${JSON.stringify(pw)}`)
      assert.equal(typeof humaniseDuration(s), "string")
    }
  }
})

test("durations are readable at every scale", () => {
  assert.match(humaniseDuration(0), /instantan/i)
  assert.match(humaniseDuration(45), /seconde/)
  assert.match(humaniseDuration(3600), /heure/)
  assert.match(humaniseDuration(60 * 60 * 24 * 400), /an/)
  assert.match(humaniseDuration(1e25), /univers/i)
})
