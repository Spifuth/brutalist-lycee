// Guards the only credential this site issues.
//
// Students never choose a password: signup mints a four-word passphrase and
// that is the entire account security. Two properties carry it, and neither is
// visible in the output. The wordlist has to be long enough -- the list is
// public in this repository, so its length *is* the entropy, and the comment
// in the first test records what happened when it was 40 words. And the draw
// has to come from a CSPRNG, not Math.random, which is seeded per context and
// predictable from enough observed output.
//
// That is why this file exists instead of a careful reviewer: both failures
// produce output indistinguishable from correct output. Four French words
// joined by hyphens, every single time, whichever way they were drawn. The
// Math.random test is worth reading as a technique -- it swaps the global out
// and restores it in a `finally`, which is how you assert that something was
// *not* called.
//
// Deleted, signup keeps working, and every account it creates stays guessable.
import { test } from "node:test"
import assert from "node:assert/strict"
import { generatePassphrase, PASSPHRASE_WORDS, passphraseBits } from "../lib/crypto.ts"

test("the wordlist is large enough to reach 40 bits with four words", () => {
  // This is the assertion the whole file exists for. The Next.js rewrite
  // shipped a 40-word list — 40 × 39 × 38 × 37 = 2 193 360, about 21 bits, on
  // a list that is public in this repository. 21 bits is hours of guessing.
  assert.ok(
    passphraseBits() >= 40,
    `a four-word passphrase is worth ${passphraseBits().toFixed(1)} bits — the wordlist (${PASSPHRASE_WORDS.length} words) is too short`,
  )
})

test("every word is plain lowercase ASCII", () => {
  // Accents are the reason a passphrase gets written on a sticky note: they
  // are painful on a phone keyboard, and NFKC normalisation at login hides the
  // mistake right up until it does not.
  for (const w of PASSPHRASE_WORDS) {
    assert.match(w, /^[a-z]+$/, `"${w}" is not plain lowercase ASCII`)
    assert.ok(w.length >= 3 && w.length <= 12, `"${w}" is ${w.length} characters — outside 3..12`)
  }
})

test("no word appears twice", () => {
  const set = new Set(PASSPHRASE_WORDS)
  assert.equal(set.size, PASSPHRASE_WORDS.length, "a duplicate word silently costs entropy")
})

test("a passphrase is four distinct words joined by hyphens", () => {
  for (let i = 0; i < 50; i++) {
    const p = generatePassphrase()
    const parts = p.split("-")
    assert.equal(parts.length, 4, `"${p}" is not four words`)
    assert.equal(new Set(parts).size, 4, `"${p}" repeats a word`)
    for (const part of parts) assert.ok(PASSPHRASE_WORDS.includes(part), `"${part}" is not in the list`)
  }
})

test("the generator does not use Math.random", () => {
  // Math.random is xorshift128+ — fast, seeded per context, and predictable
  // from enough observed output. It is fine for shuffling a playlist and wrong
  // for minting a credential. This test is the only thing that would catch a
  // future edit quietly swapping randomInt back out for the shorter spelling.
  const original = Math.random
  let used = false
  Math.random = () => {
    used = true
    return original()
  }
  try {
    for (let i = 0; i < 100; i++) generatePassphrase()
  } finally {
    Math.random = original
  }
  assert.equal(used, false, "generatePassphrase() called Math.random — passphrases must come from a CSPRNG")
})

test("two hundred passphrases are not the same passphrase", () => {
  const seen = new Set<string>()
  for (let i = 0; i < 200; i++) seen.add(generatePassphrase())
  assert.ok(seen.size > 190, `only ${seen.size} distinct passphrases out of 200 — the draw is not varying`)
})
