// The four numbers on /accueil's live-stats strip.
//
// Four counts in one statement rather than four statements, for the reason
// given under the import and for a second one worth carrying elsewhere: a
// query's cost is dominated by the round trip, not by the counting. Collapsing
// N independent reads into one subquery-per-column SELECT is usually the
// cheapest speed-up on offer, and it is the only version in which all four
// numbers describe the same instant.
import { queryOne } from "@/lib/db"

// Real counts for the /accueil live-stats strip. This page is what a whole
// classroom loads at the same moment, so every figure comes back from a
// single query round trip (subqueries in one SELECT) rather than one
// COUNT(*) per stat — see getAdminStats() in app/actions/admin.ts for the
// same house pattern.

export interface HomeStats {
  users: number
  votes: number
  quizAttempts: number
  questions: number
}

/** Zeroes rather than null on an empty database, so /accueil always renders four numbers. */
export async function getHomeStats(): Promise<HomeStats> {
  const row = await queryOne<Record<string, string>>(`
    SELECT
      (SELECT COUNT(*) FROM users)::text AS users,
      (SELECT COUNT(*) FROM votes)::text AS votes,
      (SELECT COUNT(*) FROM quiz_attempts)::text AS "quizAttempts",
      (SELECT COUNT(*) FROM questions)::text AS questions
  `)
  const n = (k: string) => Number(row?.[k] ?? 0)
  return {
    users: n("users"),
    votes: n("votes"),
    quizAttempts: n("quizAttempts"),
    questions: n("questions"),
  }
}
