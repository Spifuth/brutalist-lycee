"use server"

import { query, queryOne } from "@/lib/db"
import { requireUser, getSessionUser } from "@/lib/auth"
import { awardBadge } from "@/lib/awards"
import { revalidatePath } from "next/cache"

// ---------------- Votes ----------------

/** Returns { topicKey: count } for all topics (real tallies from the DB). */
export async function getVoteTallies(): Promise<Record<string, number>> {
  const rows = await query<{ topic_key: string; n: string }>(
    "SELECT topic_key, COUNT(*)::text AS n FROM votes GROUP BY topic_key",
  )
  const out: Record<string, number> = {}
  for (const r of rows) out[r.topic_key] = Number(r.n)
  return out
}

/** Returns the current user's selected topic keys. */
export async function getMyVotes(): Promise<string[]> {
  const user = await getSessionUser()
  if (!user) return []
  const rows = await query<{ topic_key: string }>(
    "SELECT topic_key FROM votes WHERE user_id = $1",
    [user.id],
  )
  return rows.map((r) => r.topic_key)
}

/** Toggle a vote. Enforces a max of `maxPicks` server-side. */
export async function toggleVote(
  topicKey: string,
  maxPicks = 3,
): Promise<{ ok: boolean; error?: string; picks: string[] }> {
  const user = await requireUser()
  const existing = await queryOne("SELECT 1 FROM votes WHERE user_id = $1 AND topic_key = $2", [
    user.id,
    topicKey,
  ])
  if (existing) {
    await query("DELETE FROM votes WHERE user_id = $1 AND topic_key = $2", [user.id, topicKey])
  } else {
    const count = await queryOne<{ n: string }>(
      "SELECT COUNT(*)::text AS n FROM votes WHERE user_id = $1",
      [user.id],
    )
    if (Number(count?.n ?? 0) >= maxPicks) {
      const picks = await getMyVotes()
      return { ok: false, error: `Maximum ${maxPicks} choix.`, picks }
    }
    await query("INSERT INTO votes (user_id, topic_key) VALUES ($1, $2)", [user.id, topicKey])
    await awardBadge(user.id, "voter")
  }
  revalidatePath("/interventions")
  return { ok: true, picks: await getMyVotes() }
}

// ---------------- Questions wall ----------------

export interface QuestionRow {
  id: string
  pseudo: string
  body: string
  status: string
  upvotes: number
  created_at: string
}

export async function getQuestions(onlyApproved = true): Promise<QuestionRow[]> {
  const where = onlyApproved ? "WHERE status = 'approved'" : ""
  return query<QuestionRow>(
    `SELECT id, pseudo, body, status, upvotes, created_at FROM questions ${where} ORDER BY upvotes DESC, created_at DESC`,
  )
}

export async function submitQuestion(body: string): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser()
  const text = (body || "").trim()
  if (text.length < 5) return { ok: false, error: "Question trop courte." }
  if (text.length > 500) return { ok: false, error: "Question trop longue (500 max)." }
  await query("INSERT INTO questions (user_id, pseudo, body, status) VALUES ($1, $2, $3, 'pending')", [
    user.id,
    user.pseudo,
    text,
  ])
  await awardBadge(user.id, "asker")
  revalidatePath("/interventions")
  return { ok: true }
}

export async function upvoteQuestion(id: string): Promise<{ ok: boolean }> {
  await requireUser()
  await query("UPDATE questions SET upvotes = upvotes + 1 WHERE id = $1 AND status = 'approved'", [id])
  revalidatePath("/interventions")
  return { ok: true }
}

// ---------------- Surveys ----------------

export async function saveSurvey(
  level: string,
  answers: Record<string, unknown>,
): Promise<{ ok: boolean }> {
  const user = await requireUser()
  await query(
    `INSERT INTO survey_responses (user_id, level, answers) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, level) DO UPDATE SET answers = EXCLUDED.answers, created_at = now()`,
    [user.id, level, JSON.stringify(answers)],
  )
  await query("UPDATE users SET level = $1 WHERE id = $2 AND level = 'inconnu'", [level, user.id])
  await awardBadge(user.id, `survey-${level}` as string)
  revalidatePath("/profil")
  return { ok: true }
}

export async function getMySurveys(): Promise<string[]> {
  const user = await getSessionUser()
  if (!user) return []
  const rows = await query<{ level: string }>(
    "SELECT level FROM survey_responses WHERE user_id = $1",
    [user.id],
  )
  return rows.map((r) => r.level)
}

// ---------------- Quiz attempts ----------------

export async function submitQuizAttempt(
  quizSlug: string,
  score: number,
  total: number,
): Promise<{ ok: boolean; earned: string[] }> {
  const user = await requireUser()
  const quiz = await queryOne<{ id: string; badge_slug: string | null }>(
    "SELECT id, badge_slug FROM quizzes WHERE slug = $1",
    [quizSlug],
  )
  if (!quiz) return { ok: false, earned: [] }

  await query(
    "INSERT INTO quiz_attempts (user_id, quiz_id, score, total) VALUES ($1, $2, $3, $4)",
    [user.id, quiz.id, score, total],
  )

  const earned: string[] = []
  if (await awardBadge(user.id, "quiz-first")) earned.push("quiz-first")
  if (score === total && total > 0 && (await awardBadge(user.id, "quiz-perfect")))
    earned.push("quiz-perfect")
  if (quiz.badge_slug && (await awardBadge(user.id, quiz.badge_slug))) earned.push(quiz.badge_slug)

  // "all quizzes" badge if the user has at least one attempt on every published quiz
  const coverage = await queryOne<{ done: string; total: string }>(
    `SELECT COUNT(DISTINCT qa.quiz_id)::text AS done,
            (SELECT COUNT(*)::text FROM quizzes WHERE published) AS total
       FROM quiz_attempts qa WHERE qa.user_id = $1`,
    [user.id],
  )
  if (coverage && coverage.done === coverage.total && (await awardBadge(user.id, "quiz-all")))
    earned.push("quiz-all")

  revalidatePath("/quiz")
  revalidatePath("/profil")
  return { ok: true, earned }
}

export async function getMyQuizResults(): Promise<Record<string, { score: number; total: number }>> {
  const user = await getSessionUser()
  if (!user) return {}
  const rows = await query<{ slug: string; score: number; total: number }>(
    `SELECT q.slug, qa.score, qa.total FROM quiz_attempts qa
       JOIN quizzes q ON q.id = qa.quiz_id
      WHERE qa.user_id = $1
      ORDER BY qa.completed_at ASC`,
    [user.id],
  )
  const out: Record<string, { score: number; total: number }> = {}
  for (const r of rows) out[r.slug] = { score: r.score, total: r.total } // last attempt wins
  return out
}

// ---------------- Secret hunt ----------------

export interface RedeemResult {
  ok: boolean
  error?: string
  name?: string
  points?: number
  badge?: string
}

export async function redeemSecret(code: string): Promise<RedeemResult> {
  const user = await requireUser()
  const clean = (code || "").trim().toUpperCase()
  if (!clean) return { ok: false, error: "Entre un code." }

  const secret = await queryOne<{ id: string; name: string; points: number; badge_slug: string | null }>(
    "SELECT id, name, points, badge_slug FROM secrets WHERE upper(code) = $1 AND active = TRUE",
    [clean],
  )
  if (!secret) return { ok: false, error: "Code inconnu ou désactivé." }

  const already = await queryOne("SELECT 1 FROM secret_redemptions WHERE user_id = $1 AND secret_id = $2", [
    user.id,
    secret.id,
  ])
  if (already) return { ok: false, error: "Tu as déjà validé ce secret." }

  await query("INSERT INTO secret_redemptions (user_id, secret_id) VALUES ($1, $2)", [user.id, secret.id])
  await query("UPDATE users SET points = points + $1 WHERE id = $2", [secret.points, user.id])
  await awardBadge(user.id, "hunter")
  if (secret.badge_slug) await awardBadge(user.id, secret.badge_slug)

  // "legend" if the user has now found every active secret
  const coverage = await queryOne<{ done: string; total: string }>(
    `SELECT
       (SELECT COUNT(*)::text FROM secret_redemptions sr
          JOIN secrets s ON s.id = sr.secret_id
         WHERE sr.user_id = $1 AND s.active) AS done,
       (SELECT COUNT(*)::text FROM secrets WHERE active) AS total`,
    [user.id],
  )
  if (coverage && coverage.done === coverage.total) await awardBadge(user.id, "legend")

  revalidatePath("/chasse")
  revalidatePath("/classement")
  return { ok: true, name: secret.name, points: secret.points, badge: secret.badge_slug ?? undefined }
}

export async function getMySecrets(): Promise<{ found: number; total: number; names: string[] }> {
  const user = await getSessionUser()
  const total = Number(
    (await queryOne<{ n: string }>("SELECT COUNT(*)::text AS n FROM secrets WHERE active"))?.n ?? 0,
  )
  if (!user) return { found: 0, total, names: [] }
  const rows = await query<{ name: string }>(
    `SELECT s.name FROM secret_redemptions sr JOIN secrets s ON s.id = sr.secret_id
      WHERE sr.user_id = $1 ORDER BY sr.redeemed_at ASC`,
    [user.id],
  )
  return { found: rows.length, total, names: rows.map((r) => r.name) }
}

export interface HuntEntry {
  name: string
  hint: string
  location: string
  points: number
  found: boolean
}

export async function getHuntBoard(): Promise<{ entries: HuntEntry[]; found: number; total: number }> {
  const user = await getSessionUser()
  const secrets = await query<{ id: string; name: string; hint: string; location: string; points: number }>(
    "SELECT id, name, hint, location, points FROM secrets WHERE active ORDER BY points ASC, name ASC",
  )
  let foundIds = new Set<string>()
  if (user) {
    const rows = await query<{ secret_id: string }>(
      "SELECT secret_id FROM secret_redemptions WHERE user_id = $1",
      [user.id],
    )
    foundIds = new Set(rows.map((r) => r.secret_id))
  }
  const entries = secrets.map((s) => ({
    name: s.name,
    hint: s.hint,
    location: s.location,
    points: s.points,
    found: foundIds.has(s.id),
  }))
  return { entries, found: entries.filter((e) => e.found).length, total: entries.length }
}

// ---------------- Leaderboard ----------------

export interface LeaderRow {
  pseudo: string
  points: number
  secrets: number
  badges: number
  avatarSeed: string
  avatarVariant: string
  accent: string
}

export async function getLeaderboard(limit = 50): Promise<LeaderRow[]> {
  return query<LeaderRow>(
    `SELECT u.pseudo, u.points,
            u.avatar_seed AS "avatarSeed", u.avatar_variant AS "avatarVariant", u.accent,
            (SELECT COUNT(*)::int FROM secret_redemptions sr WHERE sr.user_id = u.id) AS secrets,
            (SELECT COUNT(*)::int FROM user_badges ub WHERE ub.user_id = u.id) AS badges
       FROM users u
      WHERE u.status = 'active'
      ORDER BY u.points DESC, secrets DESC, u.created_at ASC
      LIMIT $1`,
    [limit],
  )
}
