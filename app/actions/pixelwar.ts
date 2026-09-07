"use server"

import { query, queryOne } from "@/lib/db"
import { getSessionUser, requireUser, requireAdmin } from "@/lib/auth"
import {
  COOLDOWN_MS,
  cooldownRemaining,
  encodePixels,
  isInBounds,
  isValidColor,
  PIXELWAR_CLEARED_KEY,
  type Pixel,
} from "@/lib/pixelwar"
import { pixelBroadcast } from "@/lib/pixel-broadcast"
import { setSetting } from "@/lib/settings"

export interface PlaceResult {
  ok: boolean
  error?: string
  /** Milliseconds before this student may paint again. */
  cooldownMs: number
}

/**
 * Paints one cell.
 *
 * Everything is re-validated here. The client already refuses out-of-range
 * coordinates and enforces the cooldown, but a Server Action is a public HTTP
 * endpoint: the browser's checks are for the student's benefit, not for the
 * server's.
 */
export async function placePixel(x: number, y: number, color: number): Promise<PlaceResult> {
  const user = await requireUser()

  if (!isInBounds(x, y)) return { ok: false, error: "Hors de la grille.", cooldownMs: 0 }
  if (!isValidColor(color)) return { ok: false, error: "Couleur inconnue.", cooldownMs: 0 }

  const row = await queryOne<{ placed_at: Date }>(
    "SELECT placed_at FROM pixel_cooldowns WHERE user_id = $1",
    [user.id],
  )
  const remaining = cooldownRemaining(row?.placed_at ?? null)
  if (remaining > 0) {
    return { ok: false, error: "Encore un instant.", cooldownMs: remaining }
  }

  // Upsert both in one round trip each. The cell keeps its (x, y) identity and
  // simply changes hands; the cooldown row is per student and always moves
  // forward.
  await query(
    `INSERT INTO pixel_cells (x, y, color, user_id, placed_at)
     VALUES ($1, $2, $3, $4, now())
     ON CONFLICT (x, y) DO UPDATE SET
       color = EXCLUDED.color, user_id = EXCLUDED.user_id, placed_at = now()`,
    [x, y, color, user.id],
  )
  await query(
    `INSERT INTO pixel_cooldowns (user_id, placed_at) VALUES ($1, now())
     ON CONFLICT (user_id) DO UPDATE SET placed_at = now()`,
    [user.id],
  )

  // Push straight away rather than waiting for the next tick: with a 5 s
  // cooldown, a one-second wait to see your own pixel is a third of the time
  // you spend on the page.
  await pixelBroadcast.publishNow()

  return { ok: true, cooldownMs: COOLDOWN_MS }
}

/** Whole canvas, flat-encoded. Public: watching does not need an account. */
export async function getCanvas(): Promise<number[]> {
  const rows = await query<{ x: number; y: number; color: number }>(
    "SELECT x, y, color FROM pixel_cells",
  )
  return encodePixels(rows as Pixel[])
}

/** This student's remaining wait, for the initial render. 0 when anonymous. */
export async function myCooldown(): Promise<number> {
  const user = await getSessionUser()
  if (!user) return 0
  const row = await queryOne<{ placed_at: Date }>(
    "SELECT placed_at FROM pixel_cooldowns WHERE user_id = $1",
    [user.id],
  )
  return cooldownRemaining(row?.placed_at ?? null)
}

/**
 * Wipes the canvas. Admin only.
 *
 * Deliberately does NOT clear pixel_cooldowns: emptying the board should not
 * also hand everyone an immediate free turn, which is exactly the moment a
 * fresh canvas would get scribbled on.
 */
export async function clearCanvas(): Promise<{ ok: boolean; cleared: number }> {
  await requireAdmin()
  const rows = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM pixel_cells")
  const cleared = Number(rows[0]?.count ?? 0)
  await query("DELETE FROM pixel_cells")
  // The stream reports cells that changed recently, and a DELETE leaves no row
  // to report — without this marker every open canvas would keep showing the
  // old picture. Clients watch it and clear locally when it moves.
  await setSetting(PIXELWAR_CLEARED_KEY, Date.now())
  await pixelBroadcast.publishNow()
  return { ok: true, cleared }
}
