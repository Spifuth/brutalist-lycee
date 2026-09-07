// Conway's Game of Life — the rule, on its own, with no React and no canvas.
//
// Kept separate from the component so the interesting part is testable: the
// four rules, the toroidal wrap, and the presets. tests/life.test.ts asserts
// the shapes a wrong implementation still produces movement for (a glider that
// travels the wrong way is still "alive and moving" on screen).

export interface Grid {
  width: number
  height: number
  /** Row-major, one byte per cell, 0 or 1. Index is `y * width + x`. */
  cells: Uint8Array
}

export interface Pattern {
  /** Shown in the preset picker. */
  label: string
  width: number
  height: number
  /** `[x, y]` pairs relative to the pattern's own top-left corner. */
  cells: [number, number][]
}

export function createGrid(width: number, height: number): Grid {
  return { width, height, cells: new Uint8Array(width * height) }
}

export function get(g: Grid, x: number, y: number): boolean {
  return g.cells[y * g.width + x] === 1
}

export function population(g: Grid): number {
  let n = 0
  for (let i = 0; i < g.cells.length; i++) n += g.cells[i]
  return n
}

/**
 * Live neighbours, on a torus: the left edge touches the right edge and the
 * top touches the bottom. A glider that flies off one side comes back on the
 * other instead of dying in a corner, which is what makes the page worth
 * leaving running.
 */
function liveNeighbours(g: Grid, x: number, y: number): number {
  const { width: w, height: h, cells } = g
  let n = 0
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      // + w / + h before the modulo: JS % keeps the sign of the dividend, so
      // (-1) % 64 is -1, not 63, and the wrap would read outside the array.
      const nx = (x + dx + w) % w
      const ny = (y + dy + h) % h
      n += cells[ny * w + nx]
    }
  }
  return n
}

/** One generation. Returns a new grid; the argument is never modified. */
export function step(g: Grid): Grid {
  const next = createGrid(g.width, g.height)
  for (let y = 0; y < g.height; y++) {
    for (let x = 0; x < g.width; x++) {
      const i = y * g.width + x
      const n = liveNeighbours(g, x, y)
      // Alive: 2 or 3 neighbours to survive (under- and overpopulation kill).
      // Dead: exactly 3 to be born.
      next.cells[i] = g.cells[i] === 1 ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
    }
  }
  return next
}

/** A copy of `g` with `pattern` drawn at `(ox, oy)`, wrapping at the edges. */
export function stamp(g: Grid, pattern: Pattern, ox: number, oy: number): Grid {
  const next: Grid = { width: g.width, height: g.height, cells: new Uint8Array(g.cells) }
  for (const [px, py] of pattern.cells) {
    const x = (((ox + px) % g.width) + g.width) % g.width
    const y = (((oy + py) % g.height) + g.height) % g.height
    next.cells[y * g.width + x] = 1
  }
  return next
}

/** A copy of `g` with the pattern centred. */
export function stampCentred(g: Grid, pattern: Pattern): Grid {
  return stamp(
    createGrid(g.width, g.height),
    pattern,
    Math.floor((g.width - pattern.width) / 2),
    Math.floor((g.height - pattern.height) / 2),
  )
}

/** A copy of `g` with a fresh random soup. `density` is the share of live cells. */
export function randomise(g: Grid, density = 0.28, random: () => number = Math.random): Grid {
  const next = createGrid(g.width, g.height)
  for (let i = 0; i < next.cells.length; i++) next.cells[i] = random() < density ? 1 : 0
  return next
}

/** A copy of `g` with one cell flipped — what a click on the grid does. */
export function toggle(g: Grid, x: number, y: number): Grid {
  const next: Grid = { width: g.width, height: g.height, cells: new Uint8Array(g.cells) }
  const i = y * g.width + x
  next.cells[i] = next.cells[i] === 1 ? 0 : 1
  return next
}

// --- Presets ----------------------------------------------------------------
// Every one of these is a named object in the Life literature; the labels are
// the French names a student can search for.

export const PATTERNS: Record<string, Pattern> = {
  glider: {
    label: "Planeur",
    width: 3,
    height: 3,
    cells: [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  blinker: {
    label: "Clignotant",
    width: 3,
    height: 1,
    cells: [
      [0, 0],
      [1, 0],
      [2, 0],
    ],
  },
  lwss: {
    label: "Vaisseau léger",
    width: 5,
    height: 4,
    cells: [
      [1, 0],
      [4, 0],
      [0, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  },
  pulsar: {
    label: "Pulsar",
    width: 13,
    height: 13,
    cells: [
      [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
      [0, 2], [5, 2], [7, 2], [12, 2],
      [0, 3], [5, 3], [7, 3], [12, 3],
      [0, 4], [5, 4], [7, 4], [12, 4],
      [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
      [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
      [0, 8], [5, 8], [7, 8], [12, 8],
      [0, 9], [5, 9], [7, 9], [12, 9],
      [0, 10], [5, 10], [7, 10], [12, 10],
      [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
    ],
  },
  gun: {
    label: "Canon à planeurs",
    width: 36,
    height: 9,
    cells: [
      [0, 4], [0, 5], [1, 4], [1, 5],
      [10, 4], [10, 5], [10, 6],
      [11, 3], [11, 7],
      [12, 2], [12, 8],
      [13, 2], [13, 8],
      [14, 5],
      [15, 3], [15, 7],
      [16, 4], [16, 5], [16, 6],
      [17, 5],
      [20, 2], [20, 3], [20, 4],
      [21, 2], [21, 3], [21, 4],
      [22, 1], [22, 5],
      [24, 0], [24, 1], [24, 5], [24, 6],
      [34, 2], [34, 3], [35, 2], [35, 3],
    ],
  },
}
