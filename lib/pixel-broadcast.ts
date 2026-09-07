import { createBroadcaster } from "./broadcast.ts"

/**
 * One tick of the shared canvas: everything painted recently, flat-encoded.
 *
 * NOT a diff since the previous tick. Each tick carries a small overlapping
 * window (see CATCH_UP_MS in the stream route), so a browser that connects
 * between the full-canvas query and its subscription still receives whatever
 * was painted in that gap. Re-applying a pixel that is already the right
 * colour costs nothing; missing one leaves a lie on the screen until somebody
 * happens to paint over it.
 */
export interface PixelSnapshot {
  /** `[x, y, colour, …]` — see lib/pixelwar.ts's encodePixels. */
  pixels: number[]
  /** Server time of this tick, so clients can show "à jour il y a n s". */
  at: number
  /**
   * When the canvas was last wiped, as epoch milliseconds (0 if never).
   *
   * A wipe cannot be expressed as "cells that changed recently" — a DELETE
   * leaves no row to report, so every open canvas would keep showing the old
   * picture until somebody painted over each cell individually. Clients
   * compare this against the value they last saw and clear locally when it
   * moves.
   */
  clearedAt: number
}

/**
 * The canvas's own broadcaster, separate from the live quiz's.
 *
 * These have to be two instances rather than two consumers of one module:
 * before lib/broadcast.ts existed, the subscriber set and the interval handle
 * were module-scope singletons, and a second consumer would have received the
 * quiz's snapshots and restarted its timer.
 */
export const pixelBroadcast = createBroadcaster<PixelSnapshot>("pixel-broadcast")
