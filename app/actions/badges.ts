"use server"

import { query } from "@/lib/db"
import { getSessionUser } from "@/lib/auth"

export interface BadgeView {
  slug: string
  name: string
  description: string
  icon: string
  points: number
  earned: boolean
  awardedAt: string | null
}

/** All badges in the catalogue, flagged with whether the current user earned them. */
export async function getBadgeCollection(): Promise<BadgeView[]> {
  const user = await getSessionUser()
  const rows = await query<{
    slug: string
    name: string
    description: string
    icon: string
    points: number
    awarded_at: string | null
  }>(
    `SELECT b.slug, b.name, b.description, b.icon, b.points,
            ub.awarded_at
       FROM badges b
       LEFT JOIN user_badges ub
         ON ub.badge_id = b.id AND ub.user_id = $1
      ORDER BY b.position ASC, b.name ASC`,
    [user?.id ?? null],
  )
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    description: r.description,
    icon: r.icon,
    points: r.points,
    earned: r.awarded_at != null,
    awardedAt: r.awarded_at,
  }))
}
