import "server-only"
import { query, queryOne } from "@/lib/db"

/**
 * Awards a badge (by slug) to a user if they don't already have it, and adds the
 * badge's point value to the user's total. Idempotent: a user can hold a badge
 * once. Returns true if the badge was newly awarded.
 */
export async function awardBadge(userId: string, badgeSlug: string): Promise<boolean> {
  const badge = await queryOne<{ id: string; points: number }>(
    "SELECT id, points FROM badges WHERE slug = $1",
    [badgeSlug],
  )
  if (!badge) {
    // An unknown slug used to return false indistinguishably from "the user
    // already had it", which is how three secrets sat pointing at a badge
    // called "jeu"/"Jeu" that did not exist: students redeemed them, got
    // `hunter`, silently got nothing else, and nothing anywhere said so.
    // The admin console accepts a free-text badge slug, so this is reachable
    // by typo at any time — it must be noisy.
    console.error(
      `[awards] badge slug "${badgeSlug}" does not exist — nothing was awarded. ` +
        `Check the slug on whatever referenced it (quiz.badge_slug, secret.badge_slug, or a call site).`,
    )
    return false
  }

  const inserted = await query<{ id: string }>(
    `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2)
     ON CONFLICT (user_id, badge_id) DO NOTHING
     RETURNING id`,
    [userId, badge.id],
  )
  if (inserted.length === 0) return false // already had it

  if (badge.points > 0) {
    await query("UPDATE users SET points = points + $1 WHERE id = $2", [badge.points, userId])
  }
  return true
}

/** Adds raw points to a user (e.g. secret redemption bonus beyond a badge). */
export async function addPoints(userId: string, points: number): Promise<void> {
  if (points === 0) return
  await query("UPDATE users SET points = points + $1 WHERE id = $2", [points, userId])
}
