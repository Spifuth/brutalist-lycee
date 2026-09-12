// Re-runnable seed. Upserts the starting content (docs, quizzes, badges,
// secrets) and ensures a default admin exists. Safe to run repeatedly — every
// insert is an upsert keyed on a natural key (slug/code/pseudo). Docs are
// additionally pruned: an article removed from lib/docs.ts is removed from the
// database, otherwise it would keep rendering forever.
//
//   pnpm db:seed
//
// Env:
//   SEED_ADMIN_PSEUDO       default "prof"
//   SEED_ADMIN_PASSPHRASE   if unset, a random one is generated and printed once
import pg from "pg"
import { BADGE_SEEDS } from "./seeds/badges"
import { QUIZ_SEEDS } from "./seeds/quizzes"
import { SECRET_SEEDS } from "./seeds/secrets"
import { DOC_SUBJECTS } from "../lib/docs"
import { hashPassphrase, generatePassphrase } from "../lib/crypto"
import { FINAL_MILESTONE_CODE } from "../lib/milestones"

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED
if (!connectionString) {
  console.error("[seed] DATABASE_URL is not set.")
  process.exit(1)
}
const useSsl = /sslmode=require/.test(connectionString) || /neon\.tech/.test(connectionString)

const db = new pg.Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
})

async function seedBadges() {
  for (let i = 0; i < BADGE_SEEDS.length; i++) {
    const b = BADGE_SEEDS[i]
    await db.query(
      `INSERT INTO badges (slug, name, description, icon, points, kind, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (slug) DO UPDATE SET
         name=EXCLUDED.name, description=EXCLUDED.description, icon=EXCLUDED.icon,
         points=EXCLUDED.points, kind=EXCLUDED.kind, position=EXCLUDED.position`,
      [b.slug, b.name, b.description, b.icon, b.points, b.kind, i],
    )
  }
  console.log(`[seed] badges: ${BADGE_SEEDS.length}`)
}

async function seedQuizzes() {
  for (let i = 0; i < QUIZ_SEEDS.length; i++) {
    const q = QUIZ_SEEDS[i]
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO quizzes (slug, title, description, topic, level, badge_slug, position, published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
       ON CONFLICT (slug) DO UPDATE SET
         title=EXCLUDED.title, description=EXCLUDED.description, topic=EXCLUDED.topic,
         level=EXCLUDED.level, badge_slug=EXCLUDED.badge_slug, position=EXCLUDED.position
       RETURNING id`,
      [q.slug, q.title, q.description, q.topic, q.level, q.badgeSlug ?? null, i],
    )
    const quizId = rows[0].id
    // Replace questions to stay in sync with the seed file.
    await db.query("DELETE FROM quiz_questions WHERE quiz_id = $1", [quizId])
    for (let j = 0; j < q.questions.length; j++) {
      const qq = q.questions[j]
      await db.query(
        `INSERT INTO quiz_questions (quiz_id, prompt, options, correct_index, explanation, position)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [quizId, qq.prompt, JSON.stringify(qq.options), qq.correct, qq.explanation, j],
      )
    }
  }
  console.log(`[seed] quizzes: ${QUIZ_SEEDS.length}`)
}

async function seedDocs() {
  let articleCount = 0
  for (let i = 0; i < DOC_SUBJECTS.length; i++) {
    const s = DOC_SUBJECTS[i]
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO doc_subjects (slug, title, description, icon, position)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (slug) DO UPDATE SET
         title=EXCLUDED.title, description=EXCLUDED.description, position=EXCLUDED.position
       RETURNING id`,
      [s.slug, s.title, s.description, "book", i],
    )
    const subjectId = rows[0].id
    for (let j = 0; j < s.articles.length; j++) {
      const a = s.articles[j]
      await db.query(
        `INSERT INTO doc_articles (subject_id, slug, title, summary, blocks, position, published)
         VALUES ($1,$2,$3,$4,$5,$6,TRUE)
         ON CONFLICT (subject_id, slug) DO UPDATE SET
           title=EXCLUDED.title, summary=EXCLUDED.summary, blocks=EXCLUDED.blocks,
           position=EXCLUDED.position, updated_at=now()`,
        [subjectId, a.slug, a.title, a.summary, JSON.stringify(a.blocks), j],
      )
      articleCount++
    }
  }

  // The loop above only upserts. Removing an article from lib/docs.ts would
  // otherwise leave it published in the database forever — a retired lorem
  // placeholder that keeps rendering. Prune what the code no longer declares.
  //
  // Safe: doc_articles.subject_id is the only foreign key in this area
  // (ON DELETE CASCADE from doc_subjects), and no other table references
  // doc_articles — there is no reading progress or bookmark to take down.
  const subjectSlugs = DOC_SUBJECTS.map((s) => s.slug)
  const articleKeys = DOC_SUBJECTS.flatMap((s) => s.articles.map((a) => `${s.slug}/${a.slug}`))

  const pruned = await db.query(
    `DELETE FROM doc_articles a
       USING doc_subjects s
      WHERE a.subject_id = s.id
        AND (s.slug || '/' || a.slug) <> ALL($1::text[])`,
    [articleKeys],
  )
  const prunedSubjects = await db.query(
    "DELETE FROM doc_subjects WHERE slug <> ALL($1::text[])",
    [subjectSlugs],
  )
  if (pruned.rowCount || prunedSubjects.rowCount) {
    console.log(`[seed] docs: pruned ${pruned.rowCount} article(s), ${prunedSubjects.rowCount} subject(s)`)
  }

  console.log(`[seed] docs: ${DOC_SUBJECTS.length} subjects, ${articleCount} articles`)
}

async function seedSecrets() {
  for (const s of SECRET_SEEDS) {
    await db.query(
      `INSERT INTO secrets (code, name, hint, location, points, category, difficulty, unlock_at, badge_slug, placement, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,TRUE)
       ON CONFLICT (code) DO UPDATE SET
         name=EXCLUDED.name, hint=EXCLUDED.hint, location=EXCLUDED.location,
         points=EXCLUDED.points, category=EXCLUDED.category,
         difficulty=EXCLUDED.difficulty, unlock_at=EXCLUDED.unlock_at,
         badge_slug=EXCLUDED.badge_slug, placement=EXCLUDED.placement`,
      [
        s.code, s.name, s.hint, s.location, s.points,
        s.category, s.difficulty, s.unlockAt ?? null, s.badgeSlug ?? null,
        s.placement ?? null,
      ],
    )
  }
  console.log(`[seed] secrets: ${SECRET_SEEDS.length}`)
}

async function seedAdmin() {
  const pseudo = process.env.SEED_ADMIN_PSEUDO || "prof"
  const pseudoLower = pseudo.toLowerCase()
  const existing = await db.query("SELECT id FROM users WHERE pseudo_lower = $1", [pseudoLower])
  if (existing.rows.length > 0) {
    await db.query("UPDATE users SET is_admin = TRUE WHERE pseudo_lower = $1", [pseudoLower])
    console.log(`[seed] admin "${pseudo}" already exists (ensured is_admin).`)
    return
  }
  const passphrase = process.env.SEED_ADMIN_PASSPHRASE || generatePassphrase()
  const hash = await hashPassphrase(passphrase)
  await db.query(
    `INSERT INTO users (pseudo, pseudo_lower, passphrase_hash, avatar_seed, level, is_admin)
     VALUES ($1,$2,$3,$4,'avance',TRUE)`,
    [pseudo, pseudoLower, hash, pseudo],
  )
  console.log("\n========================================")
  console.log(`[seed] ADMIN CREATED`)
  console.log(`       pseudo:     ${pseudo}`)
  console.log(`       passphrase: ${passphrase}`)
  console.log("       (note it now — it will not be shown again)")
  console.log("========================================\n")
}

/**
 * Recale le palier final sur le nombre réel de secrets ordinaires.
 *
 * Le fichier de seed déclare un seuil, et `tests/secret-seeds.test.ts` vérifie
 * qu'il colle — mais seulement au fichier. La prod a tourné avec 149 pour 156
 * secrets ordinaires, parce que sept avaient été créés depuis la console admin
 * et que le test ne voit jamais la base. Le seuil est donc recalculé ici et à
 * l'import : les deux chemins d'écriture le corrigent, aucun ne le laisse
 * dériver.
 */
async function syncFinalMilestone() {
  const { rows } = await db.query<{ unlock_at: number }>(
    `UPDATE secrets
        SET unlock_at = (SELECT COUNT(*) FROM secrets WHERE active AND unlock_at IS NULL)
      WHERE code = $1
      RETURNING unlock_at`,
    [FINAL_MILESTONE_CODE],
  )
  if (rows[0]) console.log(`[seed] palier final : ${rows[0].unlock_at} secrets ordinaires.`)
}

async function seedSettings() {
  await db.query(
    `INSERT INTO settings (key, value) VALUES ('site', $1)
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify({ intervention_open: true, questions_open: true })],
  )
}

async function main() {
  await db.connect()
  console.log("[seed] starting…")
  await seedBadges()
  await seedQuizzes()
  await seedDocs()
  await seedSecrets()
  await seedSettings()
  await seedAdmin()
  await syncFinalMilestone()
  console.log("[seed] done.")
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err)
    process.exit(1)
  })
  .finally(() => db.end())
