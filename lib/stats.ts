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
