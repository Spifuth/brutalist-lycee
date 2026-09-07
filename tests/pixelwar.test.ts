import { test } from "node:test"
import assert from "node:assert/strict"
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  COOLDOWN_MS,
  PALETTE,
  isInBounds,
  isValidColor,
  cooldownRemaining,
  encodePixels,
  decodePixels,
} from "../lib/pixelwar.ts"

test("the palette has sixteen distinct colours", () => {
  assert.equal(PALETTE.length, 16)
  assert.equal(new Set(PALETTE.map((p) => p.label)).size, 16, "two palette entries share a label")
  PALETTE.forEach((p, i) => assert.equal(p.cssVar, `--pixel-${i}`, "a palette entry points at the wrong CSS variable"))
})

test("coordinates outside the canvas are refused", () => {
  assert.equal(isInBounds(0, 0), true)
  assert.equal(isInBounds(CANVAS_WIDTH - 1, CANVAS_HEIGHT - 1), true)
  for (const [x, y] of [
    [-1, 0],
    [0, -1],
    [CANVAS_WIDTH, 0],
    [0, CANVAS_HEIGHT],
    [1.5, 0],
    [0, Number.NaN],
    [Number.POSITIVE_INFINITY, 0],
  ]) {
    assert.equal(isInBounds(x, y), false, `(${x}, ${y}) was accepted`)
  }
})

test("only the sixteen palette indices are valid colours", () => {
  for (let i = 0; i < 16; i++) assert.equal(isValidColor(i), true)
  for (const bad of [-1, 16, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(isValidColor(bad), false, `${bad} was accepted as a colour`)
  }
})

test("the cooldown counts down and then stops", () => {
  const now = 1_700_000_000_000
  assert.equal(cooldownRemaining(null, now), 0, "someone who never placed is made to wait")
  assert.equal(cooldownRemaining(new Date(now), now), COOLDOWN_MS)
  assert.equal(cooldownRemaining(new Date(now - COOLDOWN_MS / 2), now), COOLDOWN_MS / 2)
  assert.equal(cooldownRemaining(new Date(now - COOLDOWN_MS), now), 0)
  assert.equal(cooldownRemaining(new Date(now - 10 * COOLDOWN_MS), now), 0, "the wait went negative")
  // A clock skew that puts the last placement in the future must not lock
  // someone out forever.
  assert.ok(cooldownRemaining(new Date(now + 60_000), now) <= COOLDOWN_MS)
})

test("pixels survive a round trip through the flat encoding", () => {
  const pixels = [
    { x: 0, y: 0, color: 0 },
    { x: 299, y: 299, color: 15 },
    { x: 12, y: 250, color: 7 },
  ]
  assert.deepEqual(decodePixels(encodePixels(pixels)), pixels)
})

test("a truncated flat array is refused, not silently shifted", () => {
  // The wire format is [x, y, colour, x, y, colour, …]. Drop one number and
  // every following pixel reads one slot early: colours become coordinates and
  // the whole canvas smears. It does not throw on its own — decode has to.
  const flat = encodePixels([
    { x: 1, y: 2, color: 3 },
    { x: 4, y: 5, color: 6 },
  ])
  assert.deepEqual(decodePixels(flat).length, 2)
  assert.throws(() => decodePixels(flat.slice(0, 5)), /multiple de 3|multiple of 3/i)
})

test("decoding refuses values that would land outside the canvas", () => {
  // The stream is server-authored today, but the decoder is the last place
  // that can stop a bad row from being drawn at a negative offset.
  assert.throws(() => decodePixels([-1, 0, 0]))
  assert.throws(() => decodePixels([0, 0, 99]))
})

test("the canvas is the size the design settled on", () => {
  assert.equal(CANVAS_WIDTH, 300)
  assert.equal(CANVAS_HEIGHT, 300)
  assert.equal(COOLDOWN_MS, 5000)
})
