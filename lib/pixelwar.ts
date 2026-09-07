// The shared canvas: geometry, palette, cooldown and wire format.
//
// No React, no database, no server — everything here is used on both sides of
// the connection, and it is the part where a mistake is silent rather than
// loud. A colour index one past the end of the palette does not throw, it
// draws transparent. A flat array missing one number does not throw, it shifts
// every following pixel by one slot and smears the whole canvas.

export const CANVAS_WIDTH = 300
export const CANVAS_HEIGHT = 300

/**
 * Settings key holding the epoch-ms of the last wipe.
 *
 * Lives here rather than in app/actions/pixelwar.ts because a "use server"
 * module may only export async functions — a plain const there is a build
 * error, not a style preference.
 */
export const PIXELWAR_CLEARED_KEY = "pixelwar_cleared_at"

/** How long a student waits between two pixels. */
export const COOLDOWN_MS = 5000

export interface PaletteEntry {
  label: string
  /** Read at draw time from globals.css — see the canvas component. */
  cssVar: string
}

/**
 * Sixteen colours, defined in app/globals.css as `--pixel-0` … `--pixel-15`.
 *
 * They live in CSS rather than as hex literals here for the reason the whole
 * repo does: the style gate allows raw hex in exactly one file. Canvas needs a
 * real colour string, so the component resolves the variable at draw time —
 * which also means the palette follows the light/dark toggle for free.
 */
export const PALETTE: PaletteEntry[] = [
  { label: "encre", cssVar: "--pixel-0" },
  { label: "gris", cssVar: "--pixel-1" },
  { label: "argent", cssVar: "--pixel-2" },
  { label: "papier", cssVar: "--pixel-3" },
  { label: "bordeaux", cssVar: "--pixel-4" },
  { label: "rouge", cssVar: "--pixel-5" },
  { label: "orange", cssVar: "--pixel-6" },
  { label: "ambre", cssVar: "--pixel-7" },
  { label: "olive", cssVar: "--pixel-8" },
  { label: "vert", cssVar: "--pixel-9" },
  { label: "menthe", cssVar: "--pixel-10" },
  { label: "cyan", cssVar: "--pixel-11" },
  { label: "azur", cssVar: "--pixel-12" },
  { label: "outremer", cssVar: "--pixel-13" },
  { label: "violet", cssVar: "--pixel-14" },
  { label: "rose", cssVar: "--pixel-15" },
]

export interface Pixel {
  x: number
  y: number
  color: number
}

export function isInBounds(x: number, y: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    x < CANVAS_WIDTH &&
    y >= 0 &&
    y < CANVAS_HEIGHT
  )
}

export function isValidColor(color: number): boolean {
  return Number.isInteger(color) && color >= 0 && color < PALETTE.length
}

/**
 * Milliseconds still to wait, from the moment of a student's last placement.
 *
 * Clamped at both ends. Never negative, so an old placement reads as ready;
 * and never above the full cooldown, so a clock that puts the last placement
 * in the future cannot lock someone out for an hour.
 */
export function cooldownRemaining(lastPlacedAt: Date | null, now: number = Date.now()): number {
  if (!lastPlacedAt) return 0
  const elapsed = now - lastPlacedAt.getTime()
  if (elapsed >= COOLDOWN_MS) return 0
  if (elapsed < 0) return COOLDOWN_MS
  return COOLDOWN_MS - elapsed
}

/**
 * Wire format: `[x, y, colour, x, y, colour, …]`.
 *
 * Flat rather than an array of objects because a full canvas is sent on every
 * connection — `{"x":12,"y":250,"color":7}` is 26 bytes where `12,250,7` is 8.
 */
export function encodePixels(pixels: Pixel[]): number[] {
  const out: number[] = []
  for (const p of pixels) out.push(p.x, p.y, p.color)
  return out
}

export function decodePixels(flat: number[]): Pixel[] {
  if (flat.length % 3 !== 0) {
    // Refuse rather than round down. A truncated array does not look broken:
    // every pixel after the cut reads one slot early, so colours become
    // coordinates and the canvas smears instead of erroring.
    throw new Error(`pixelwar: flux de ${flat.length} valeurs, ce n'est pas un multiple de 3`)
  }
  const out: Pixel[] = []
  for (let i = 0; i < flat.length; i += 3) {
    const [x, y, color] = [flat[i], flat[i + 1], flat[i + 2]]
    if (!isInBounds(x, y)) throw new Error(`pixelwar: pixel hors de la grille (${x}, ${y})`)
    if (!isValidColor(color)) throw new Error(`pixelwar: couleur inconnue ${color}`)
    out.push({ x, y, color })
  }
  return out
}
