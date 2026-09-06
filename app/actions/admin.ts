"use server"

import { revalidatePath } from "next/cache"
import { query, queryOne } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { hashPassphrase, generatePassphrase } from "@/lib/crypto"
import { deleteAvatarFile } from "@/lib/avatar-storage"

// ---------------- Overview ----------------

export interface AdminStats {
  users: number
  active: number
  suspended: number
  badgesAwarded: number
  quizAttempts: number
  votes: number
  pendingQuestions: number
  secrets: number
  redemptions: number
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin()
  const row = await queryOne<Record<string, string>>(`
    SELECT
      (SELECT COUNT(*) FROM users)::text AS users,
      (SELECT COUNT(*) FROM users WHERE status = 'active')::text AS active,
      (SELECT COUNT(*) FROM users WHERE status = 'suspended')::text AS suspended,
      (SELECT COUNT(*) FROM user_badges)::text AS "badgesAwarded",
      (SELECT COUNT(*) FROM quiz_attempts)::text AS "quizAttempts",
      (SELECT COUNT(*) FROM votes)::text AS votes,
      (SELECT COUNT(*) FROM questions WHERE status = 'pending')::text AS "pendingQuestions",
      (SELECT COUNT(*) FROM secrets)::text AS secrets,
      (SELECT COUNT(*) FROM secret_redemptions)::text AS redemptions
  `)
  const n = (k: string) => Number(row?.[k] ?? 0)
  return {
    users: n("users"),
    active: n("active"),
    suspended: n("suspended"),
    badgesAwarded: n("badgesAwarded"),
    quizAttempts: n("quizAttempts"),
    votes: n("votes"),
    pendingQuestions: n("pendingQuestions"),
    secrets: n("secrets"),
    redemptions: n("redemptions"),
  }
}

// ---------------- User management ----------------

export interface AdminUser {
  id: string
  pseudo: string
  level: string
  status: string
  isAdmin: boolean
  points: number
  badges: number
  secrets: number
  createdAt: string
  lastSeenAt: string
}

export async function listUsers(search = ""): Promise<AdminUser[]> {
  await requireAdmin()
  const like = `%${search.trim().toLowerCase()}%`
  return query<AdminUser>(
    `SELECT u.id, u.pseudo, u.level, u.status, u.is_admin AS "isAdmin", u.points,
            u.created_at AS "createdAt", u.last_seen_at AS "lastSeenAt",
            (SELECT COUNT(*)::int FROM user_badges ub WHERE ub.user_id = u.id) AS badges,
            (SELECT COUNT(*)::int FROM secret_redemptions sr WHERE sr.user_id = u.id) AS secrets
       FROM users u
      WHERE ($1 = '%%') OR (u.pseudo_lower LIKE $1)
      ORDER BY u.created_at DESC`,
    [like],
  )
}

export async function resetUserPassphrase(userId: string): Promise<{ passphrase: string }> {
  await requireAdmin()
  const passphrase = generatePassphrase()
  const hash = await hashPassphrase(passphrase)
  await query("UPDATE users SET passphrase_hash = $1 WHERE id = $2", [hash, userId])
  // Force re-login everywhere by clearing sessions.
  await query("DELETE FROM sessions WHERE user_id = $1", [userId])
  revalidatePath("/admin")
  return { passphrase }
}

export async function setUserStatus(userId: string, status: "active" | "suspended") {
  const admin = await requireAdmin()
  if (userId === admin.id) throw new Error("Impossible de te suspendre toi-même.")
  await query("UPDATE users SET status = $1 WHERE id = $2", [status, userId])
  if (status === "suspended") await query("DELETE FROM sessions WHERE user_id = $1", [userId])
  revalidatePath("/admin")
}

export async function setUserAdmin(userId: string, isAdmin: boolean) {
  const admin = await requireAdmin()
  if (userId === admin.id && !isAdmin) throw new Error("Impossible de retirer ton propre accès admin.")
  await query("UPDATE users SET is_admin = $1 WHERE id = $2", [isAdmin, userId])
  revalidatePath("/admin")
}

export async function resetUserProgress(userId: string) {
  await requireAdmin()
  await query("DELETE FROM quiz_attempts WHERE user_id = $1", [userId])
  await query("DELETE FROM survey_responses WHERE user_id = $1", [userId])
  await query("DELETE FROM user_badges WHERE user_id = $1", [userId])
  await query("DELETE FROM secret_redemptions WHERE user_id = $1", [userId])
  await query("UPDATE users SET points = 0, level = 'inconnu' WHERE id = $1", [userId])
  revalidatePath("/admin")
}

export async function deleteUser(userId: string) {
  const admin = await requireAdmin()
  if (userId === admin.id) throw new Error("Impossible de supprimer ton propre compte.")
  await query("DELETE FROM users WHERE id = $1", [userId]) // cascades to all child rows
  revalidatePath("/admin")
}

// ---------------- Avatars moderation ----------------
// The compensating control for having no upload approval queue: photos go
// live immediately, and removal here is the only lever. Newest first, one
// click, no confirmation chain — see components/admin/tabs/avatars-tab.tsx.

export interface AdminAvatar {
  userId: string
  pseudo: string
  avatarFile: string
  uploadedAt: string
}

export async function listAvatars(): Promise<AdminAvatar[]> {
  await requireAdmin()
  return query<AdminAvatar>(
    `SELECT id AS "userId", pseudo, avatar_file AS "avatarFile", avatar_uploaded_at AS "uploadedAt"
       FROM users
      WHERE avatar_file IS NOT NULL
      ORDER BY avatar_uploaded_at DESC`,
  )
}

export async function removeAvatar(userId: string): Promise<void> {
  await requireAdmin()
  await processRemoveAvatar(userId)
  revalidatePath("/admin")
  revalidatePath("/profil")
  revalidatePath("/classement")
}

/**
 * The DB + filesystem effect of a removal, factored out from `removeAvatar`
 * for the same reason `processAvatarUpload` is factored out of
 * `uploadAvatar`: `requireAdmin()` needs a real request context and can't be
 * driven from a plain script, but this can — it's what the manual
 * verification pass calls directly against a real (throwaway) database.
 */
export async function processRemoveAvatar(userId: string): Promise<void> {
  const row = await queryOne<{ avatar_file: string | null }>(
    "SELECT avatar_file FROM users WHERE id = $1",
    [userId],
  )
  await query("UPDATE users SET avatar_file = NULL, avatar_uploaded_at = NULL WHERE id = $1", [userId])
  if (row?.avatar_file) {
    await deleteAvatarFile(row.avatar_file).catch(() => {})
  }
}

// ---------------- Badges CRUD ----------------

export interface BadgeRow {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  points: number
  kind: string
  position: number
}

export async function listBadges(): Promise<BadgeRow[]> {
  await requireAdmin()
  return query<BadgeRow>(
    "SELECT id, slug, name, description, icon, points, kind, position FROM badges ORDER BY position ASC, name ASC",
  )
}

export async function upsertBadge(input: Omit<BadgeRow, "id"> & { id?: string }) {
  await requireAdmin()
  if (input.id) {
    await query(
      "UPDATE badges SET slug=$2, name=$3, description=$4, icon=$5, points=$6, kind=$7, position=$8 WHERE id=$1",
      [input.id, input.slug, input.name, input.description, input.icon, input.points, input.kind, input.position],
    )
  } else {
    await query(
      "INSERT INTO badges (slug, name, description, icon, points, kind, position) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [input.slug, input.name, input.description, input.icon, input.points, input.kind, input.position],
    )
  }
  revalidatePath("/admin")
  revalidatePath("/profil")
}

export async function deleteBadge(id: string) {
  await requireAdmin()
  await query("DELETE FROM badges WHERE id = $1", [id])
  revalidatePath("/admin")
}

// ---------------- Secrets CRUD ----------------

export interface SecretRow {
  id: string
  code: string
  name: string
  hint: string
  location: string
  points: number
  badgeSlug: string | null
  active: boolean
  redemptions: number
}

export async function listSecrets(): Promise<SecretRow[]> {
  await requireAdmin()
  return query<SecretRow>(
    `SELECT s.id, s.code, s.name, s.hint, s.location, s.points,
            s.badge_slug AS "badgeSlug", s.active,
            (SELECT COUNT(*)::int FROM secret_redemptions sr WHERE sr.secret_id = s.id) AS redemptions
       FROM secrets s ORDER BY s.points ASC, s.name ASC`,
  )
}

export async function upsertSecret(input: Omit<SecretRow, "id" | "redemptions"> & { id?: string }) {
  await requireAdmin()
  const code = input.code.trim().toUpperCase()
  if (input.id) {
    await query(
      "UPDATE secrets SET code=$2, name=$3, hint=$4, location=$5, points=$6, badge_slug=$7, active=$8 WHERE id=$1",
      [input.id, code, input.name, input.hint, input.location, input.points, input.badgeSlug || null, input.active],
    )
  } else {
    await query(
      "INSERT INTO secrets (code, name, hint, location, points, badge_slug, active) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [code, input.name, input.hint, input.location, input.points, input.badgeSlug || null, input.active],
    )
  }
  revalidatePath("/admin")
  revalidatePath("/chasse")
}

export async function deleteSecret(id: string) {
  await requireAdmin()
  await query("DELETE FROM secrets WHERE id = $1", [id])
  revalidatePath("/admin")
  revalidatePath("/chasse")
}

// ---------------- Quizzes CRUD ----------------

export interface AdminQuiz {
  id: string
  slug: string
  title: string
  description: string
  topic: string
  level: string
  badgeSlug: string | null
  published: boolean
  position: number
  questions: number
}

export async function listQuizzes(): Promise<AdminQuiz[]> {
  await requireAdmin()
  return query<AdminQuiz>(
    `SELECT q.id, q.slug, q.title, q.description, q.topic, q.level,
            q.badge_slug AS "badgeSlug", q.published, q.position,
            (SELECT COUNT(*)::int FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS questions
       FROM quizzes q ORDER BY q.position ASC, q.title ASC`,
  )
}

export async function upsertQuiz(input: Omit<AdminQuiz, "id" | "questions"> & { id?: string }) {
  await requireAdmin()
  if (input.id) {
    await query(
      "UPDATE quizzes SET slug=$2, title=$3, description=$4, topic=$5, level=$6, badge_slug=$7, published=$8, position=$9 WHERE id=$1",
      [input.id, input.slug, input.title, input.description, input.topic, input.level, input.badgeSlug || null, input.published, input.position],
    )
    revalidatePath("/admin")
    revalidatePath("/quiz")
    return input.id
  }
  const row = await queryOne<{ id: string }>(
    "INSERT INTO quizzes (slug, title, description, topic, level, badge_slug, published, position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
    [input.slug, input.title, input.description, input.topic, input.level, input.badgeSlug || null, input.published, input.position],
  )
  revalidatePath("/admin")
  revalidatePath("/quiz")
  return row!.id
}

export async function deleteQuiz(id: string) {
  await requireAdmin()
  await query("DELETE FROM quizzes WHERE id = $1", [id])
  revalidatePath("/admin")
  revalidatePath("/quiz")
}

export interface AdminQuizQuestion {
  id: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  position: number
}

export async function listQuizQuestions(quizId: string): Promise<AdminQuizQuestion[]> {
  await requireAdmin()
  return query<AdminQuizQuestion>(
    `SELECT id, prompt, options, correct_index AS "correctIndex", explanation, position
       FROM quiz_questions WHERE quiz_id = $1 ORDER BY position ASC`,
    [quizId],
  )
}

export async function upsertQuizQuestion(
  quizId: string,
  input: Omit<AdminQuizQuestion, "id"> & { id?: string },
) {
  await requireAdmin()
  if (input.id) {
    await query(
      "UPDATE quiz_questions SET prompt=$2, options=$3, correct_index=$4, explanation=$5, position=$6 WHERE id=$1",
      [input.id, input.prompt, JSON.stringify(input.options), input.correctIndex, input.explanation, input.position],
    )
  } else {
    await query(
      "INSERT INTO quiz_questions (quiz_id, prompt, options, correct_index, explanation, position) VALUES ($1,$2,$3,$4,$5,$6)",
      [quizId, input.prompt, JSON.stringify(input.options), input.correctIndex, input.explanation, input.position],
    )
  }
  revalidatePath("/admin")
  revalidatePath("/quiz")
}

export async function deleteQuizQuestion(id: string) {
  await requireAdmin()
  await query("DELETE FROM quiz_questions WHERE id = $1", [id])
  revalidatePath("/admin")
  revalidatePath("/quiz")
}

// ---------------- Docs CRUD ----------------

export interface AdminDocSubject {
  id: string
  slug: string
  title: string
  description: string
  icon: string
  position: number
  articles: number
}

export async function listDocSubjects(): Promise<AdminDocSubject[]> {
  await requireAdmin()
  return query<AdminDocSubject>(
    `SELECT s.id, s.slug, s.title, s.description, s.icon, s.position,
            (SELECT COUNT(*)::int FROM doc_articles a WHERE a.subject_id = s.id) AS articles
       FROM doc_subjects s ORDER BY s.position ASC`,
  )
}

export async function upsertDocSubject(input: Omit<AdminDocSubject, "id" | "articles"> & { id?: string }) {
  await requireAdmin()
  if (input.id) {
    await query("UPDATE doc_subjects SET slug=$2, title=$3, description=$4, icon=$5, position=$6 WHERE id=$1", [
      input.id, input.slug, input.title, input.description, input.icon, input.position,
    ])
  } else {
    await query("INSERT INTO doc_subjects (slug, title, description, icon, position) VALUES ($1,$2,$3,$4,$5)", [
      input.slug, input.title, input.description, input.icon, input.position,
    ])
  }
  revalidatePath("/admin")
  revalidatePath("/docs")
}

export async function deleteDocSubject(id: string) {
  await requireAdmin()
  await query("DELETE FROM doc_subjects WHERE id = $1", [id])
  revalidatePath("/admin")
  revalidatePath("/docs")
}

export interface AdminDocArticle {
  id: string
  subjectId: string
  slug: string
  title: string
  summary: string
  blocksText: string
  position: number
  published: boolean
}

export async function listDocArticles(subjectId: string): Promise<AdminDocArticle[]> {
  await requireAdmin()
  const rows = await query<Omit<AdminDocArticle, "blocksText"> & { blocks: unknown }>(
    `SELECT id, subject_id AS "subjectId", slug, title, summary, blocks, position, published
       FROM doc_articles WHERE subject_id = $1 ORDER BY position ASC`,
    [subjectId],
  )
  return rows.map((r) => ({ ...r, blocksText: JSON.stringify(r.blocks, null, 2) }))
}

export async function upsertDocArticle(
  input: Omit<AdminDocArticle, "id" | "blocksText"> & { id?: string; blocksText: string },
) {
  await requireAdmin()
  let blocks: unknown
  try {
    blocks = JSON.parse(input.blocksText || "[]")
  } catch {
    throw new Error("Le contenu (blocks) n'est pas un JSON valide.")
  }
  if (input.id) {
    await query(
      "UPDATE doc_articles SET slug=$2, title=$3, summary=$4, blocks=$5, position=$6, published=$7, updated_at=now() WHERE id=$1",
      [input.id, input.slug, input.title, input.summary, JSON.stringify(blocks), input.position, input.published],
    )
  } else {
    await query(
      "INSERT INTO doc_articles (subject_id, slug, title, summary, blocks, position, published) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [input.subjectId, input.slug, input.title, input.summary, JSON.stringify(blocks), input.position, input.published],
    )
  }
  revalidatePath("/admin")
  revalidatePath("/docs")
}

export async function deleteDocArticle(id: string) {
  await requireAdmin()
  await query("DELETE FROM doc_articles WHERE id = $1", [id])
  revalidatePath("/admin")
  revalidatePath("/docs")
}

// ---------------- Questions moderation ----------------

export interface ModQuestion {
  id: string
  pseudo: string
  body: string
  status: string
  upvotes: number
  createdAt: string
}

export async function listAllQuestions(): Promise<ModQuestion[]> {
  await requireAdmin()
  return query<ModQuestion>(
    `SELECT id, pseudo, body, status, upvotes, created_at AS "createdAt"
       FROM questions ORDER BY created_at DESC`,
  )
}

export async function setQuestionStatus(id: string, status: "approved" | "rejected" | "pending") {
  await requireAdmin()
  await query("UPDATE questions SET status = $1 WHERE id = $2", [status, id])
  revalidatePath("/admin")
  revalidatePath("/questions")
}

export async function deleteQuestion(id: string) {
  await requireAdmin()
  await query("DELETE FROM questions WHERE id = $1", [id])
  revalidatePath("/admin")
  revalidatePath("/questions")
}

// ---------------- Manual badge grants ----------------

export interface GrantableBadge {
  slug: string
  name: string
  points: number
  held: boolean
}

/**
 * Every badge, flagged with whether this user already holds it.
 *
 * Exists because `kind: "manual"` badges had no grant path at all: nothing
 * outside awardBadge() ever wrote to user_badges, so seven of them
 * (citoyen, marathonien, matinal, night-owl, perfectionniste, polyvalent,
 * vieux-gamer) were displayed on the badge wall and were literally
 * impossible to obtain. "Manual" only means anything if a human can do it.
 */
export async function listBadgesForUser(userId: string): Promise<GrantableBadge[]> {
  await requireAdmin()
  return await query<GrantableBadge>(
    `SELECT b.slug, b.name, b.points, (ub.user_id IS NOT NULL) AS held
       FROM badges b
       LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1
      ORDER BY b.position, b.slug`,
    [userId],
  )
}

/** Grants a badge by slug. Idempotent, and adds the badge's points once. */
export async function grantBadge(userId: string, slug: string): Promise<void> {
  await requireAdmin()
  const { awardBadge } = await import("@/lib/awards")
  await awardBadge(userId, slug)
}

/** Removes a badge and takes its points back, so a mis-click is fully undoable. */
export async function revokeBadge(userId: string, slug: string): Promise<void> {
  await requireAdmin()
  const badge = await queryOne<{ id: string; points: number }>(
    "SELECT id, points FROM badges WHERE slug = $1",
    [slug],
  )
  if (!badge) return
  const removed = await query<{ id: string }>(
    "DELETE FROM user_badges WHERE user_id = $1 AND badge_id = $2 RETURNING id",
    [userId, badge.id],
  )
  if (removed.length > 0 && badge.points > 0) {
    // Symmetrical with awardBadge, and floored at 0 so revoking a badge the
    // student earned before a progress reset cannot push them negative.
    await query("UPDATE users SET points = GREATEST(0, points - $1) WHERE id = $2", [
      badge.points,
      userId,
    ])
  }
}
