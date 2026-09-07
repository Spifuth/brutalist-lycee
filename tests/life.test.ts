import { test } from "node:test"
import assert from "node:assert/strict"
import { createGrid, step, get, population, PATTERNS, stamp, type Grid } from "../lib/life.ts"

// Small helper: build a grid from an ASCII picture so the expected shapes in
// these tests are readable as shapes, not as coordinate lists.
function fromRows(rows: string[]): Grid {
  const g = createGrid(rows[0].length, rows.length)
  rows.forEach((row, y) => {
    ;[...row].forEach((c, x) => {
      if (c === "#") g.cells[y * g.width + x] = 1
    })
  })
  return g
}

function toRows(g: Grid): string[] {
  const out: string[] = []
  for (let y = 0; y < g.height; y++) {
    let row = ""
    for (let x = 0; x < g.width; x++) row += g.cells[y * g.width + x] ? "#" : "."
    out.push(row)
  }
  return out
}

test("a lone cell dies of loneliness", () => {
  const g = fromRows([".....", ".....", "..#..", ".....", "....."])
  assert.equal(population(step(g)), 0)
})

test("a cell with four neighbours dies of overcrowding", () => {
  // The centre cell has four neighbours; the corners of the plus have three
  // and survive, so only the centre is asserted here.
  const g = fromRows([".....", "..#..", ".###.", "..#..", "....."])
  assert.equal(get(step(g), 2, 2), false)
})

test("a dead cell with exactly three neighbours is born", () => {
  const g = fromRows(["....", ".##.", ".#..", "...."])
  assert.equal(get(step(g), 2, 2), true)
})

test("a 2x2 block never moves", () => {
  const g = fromRows(["....", ".##.", ".##.", "...."])
  assert.deepEqual(toRows(step(g)), toRows(g))
})

test("a blinker oscillates with a period of two", () => {
  const horizontal = fromRows([".....", ".....", ".###.", ".....", "....."])
  const vertical = fromRows([".....", "..#..", "..#..", "..#..", "....."])
  assert.deepEqual(toRows(step(horizontal)), toRows(vertical))
  assert.deepEqual(toRows(step(vertical)), toRows(horizontal))
})

test("a glider travels one cell diagonally every four generations", () => {
  // The defining property of the glider: after four steps it is the same
  // shape, displaced by (1, 1). A rule that is subtly wrong still produces
  // *something* that moves, so the assertion compares the whole grid against
  // the same glider stamped one cell along, not just its population.
  const start = stamp(createGrid(12, 12), PATTERNS.glider, 1, 1)
  const expected = stamp(createGrid(12, 12), PATTERNS.glider, 2, 2)
  let g = start
  for (let i = 0; i < 4; i++) g = step(g)
  assert.deepEqual(toRows(g), toRows(expected))
})

test("the grid is a torus — the edges are neighbours", () => {
  // Three cells hugging the left and right edges of the same row form a
  // blinker that only works if column 0 and column width-1 touch. On a finite
  // grid with dead borders this dies instead.
  const g = createGrid(5, 5)
  g.cells[2 * 5 + 4] = 1
  g.cells[2 * 5 + 0] = 1
  g.cells[2 * 5 + 1] = 1
  const next = step(g)
  assert.equal(population(next), 3, "the wrap-around blinker died — the grid is not toroidal")
  assert.equal(get(next, 0, 1), true)
  assert.equal(get(next, 0, 3), true)
})

test("every preset fits inside the bounding box it declares", () => {
  // stamp() offsets by the pattern's own width/height when centring. A cell
  // outside the declared box is not an error at stamp time — it just lands
  // somewhere the caller did not plan for, off-centre or wrapped to the far
  // side of the grid, and the preset looks broken for no visible reason.
  for (const [key, p] of Object.entries(PATTERNS)) {
    assert.ok(p.cells.length > 0, `preset "${key}" is empty`)
    for (const [x, y] of p.cells) {
      assert.ok(x >= 0 && x < p.width, `preset "${key}" has a cell at x=${x}, outside its width ${p.width}`)
      assert.ok(y >= 0 && y < p.height, `preset "${key}" has a cell at y=${y}, outside its height ${p.height}`)
    }
  }
})

test("stamping never mutates the grid it was given", () => {
  // The React component keeps the previous grid in state; a mutating stamp
  // would edit the state object in place and the re-render would show nothing.
  const empty = createGrid(10, 10)
  stamp(empty, PATTERNS.glider, 0, 0)
  assert.equal(population(empty), 0, "stamp() mutated its argument")
})
