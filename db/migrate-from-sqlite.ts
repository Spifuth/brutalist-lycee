// One-time SQLite (old Astro app) → PostgreSQL (this app) data migration.
// See the vault: "Migration des données — SQLite → PostgreSQL" (sub-project
// C) for the full rationale behind every mapping below — this file is the
// "what", the vault page is the "why".
//
// Usage:
//   pnpm db:migrate-legacy [--source=/tmp/legacy-app.db] [--dry-run|--commit]
//
// --dry-run is the DEFAULT. Nothing is written to Postgres unless --commit
// is passed explicitly. This is not a convention this file has to remember
// to honour — it is structural: every statement below runs inside a single
// transaction, and the transaction is COMMITted only if --commit was given;
// otherwise it is always ROLLBACKed, even if every number matched. There is
// no code path that writes without that flag.
//
// The SQLite source is opened read-only (node:sqlite, `readOnly: true`) and
// nothing here ever executes a write against it. Safe copy procedure is
// documented in the migration plan; the short version:
//   docker exec lycee-api python -c "import sqlite3; c=sqlite3.connect('/data/app.db'); c.execute('PRAGMA wal_checkpoint(TRUNCATE)'); c.close()"
//   docker cp lycee-api:/data/app.db /tmp/legacy-app.db
//
// Every insert is `ON CONFLICT DO NOTHING`, so running this script twice
// (accidentally or on purpose) cannot double any row. For the two tables
// with no natural business key to conflict on (`questions`, `live_sessions`
// — old integer autoincrement ids, nothing else unique), this file assigns
// a deterministic id (UUID v5, keyed on the old table name + old integer
// id) instead of a random one, so the *id itself* becomes the natural key a
// rerun collides on. Every other migrated table already has a natural key
// in the new schema (`users.pseudo_lower`, `badges.slug`, or a composite
// UNIQUE constraint carried over from the old schema's own uniqueness), so
// their ids are left to the database's own `gen_random_uuid()` default.
import { DatabaseSync } from "node:sqlite"
import { createHash } from "node:crypto"
import pg from "pg"

import { BADGE_MAP, ORPHAN_BADGES } from "../lib/migration/badge-map.ts"
import { resolveCollisions, type MigrationUser } from "../lib/migration/collisions.ts"

// ---------------------------------------------------------------------
// The numbers are assertions, not estimates (vault page, "The cost, stated
// plainly"). If a dry run — or a commit — produces anything else, the
// mapping is wrong and the run must stop, not proceed with a shrug.
// ---------------------------------------------------------------------
const EXPECTED = {
  users: { source: 20, migrates: 19 },
  badge_unlocks: { source: 106, migrates: 102 },
  live_answers: { source: 196, migrates: 196 },
  live_participants: { source: 24, migrates: 24 },
  live_sessions: { source: 14, migrates: 14 },
  questions: { source: 11, migrates: 11 },
  votes: { source: 0, migrates: 0 },
  app_state: { source: 4, migrates: 2 },
  events: { source: 789, migrates: 0 },
} as const

// =======================================================================
// CLI args
// =======================================================================
const argv = process.argv.slice(2)
const wantsCommit = argv.includes("--commit")
const wantsDryRun = argv.includes("--dry-run")
if (wantsCommit && wantsDryRun) {
  console.error("[migrate] pass either --dry-run or --commit, not both.")
  process.exit(2)
}
const commit = wantsCommit // dry-run is the default: commit is false unless asked for explicitly
const sourceArg = argv.find((a) => a.startsWith("--source="))
const sourcePath = sourceArg ? sourceArg.slice("--source=".length) : "/tmp/legacy-app.db"

// =======================================================================
// Small helpers
// =======================================================================

/**
 * Deterministic UUID v5 (RFC 4122 §4.3), stdlib-only (sha1 + bit twiddling —
 * Node has no built-in v5 generator). Namespace is an arbitrary fixed
 * constant private to this migration; all that matters is that it never
 * changes between runs, so `uuidv5("live_session:14")` is the same value
 * today and in six months.
 */
const MIGRATION_NAMESPACE = "c9f1a3e0-6b1a-4a7a-9b0a-2f6a8b1a3e0c"
function uuidv5(name: string, namespace: string = MIGRATION_NAMESPACE): string {
  const nsBytes = Buffer.from(namespace.replace(/-/g, ""), "hex")
  const nameBytes = Buffer.from(name, "utf8")
  const hash = createHash("sha1").update(Buffer.concat([nsBytes, nameBytes])).digest()
  const bytes = Buffer.from(hash.subarray(0, 16))
  bytes[6] = (bytes[6] & 0x0f) | 0x50 // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80 // variant RFC 4122
  const hex = bytes.toString("hex")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * The old app's `UTCDateTime` (api/app/time.py) stores naive UTC strings —
 * no offset, because SQLite has no timezone type. Appending "Z" is what
 * makes that explicit again for Postgres's TIMESTAMPTZ columns.
 */
function parseUtc(sqliteTimestamp: string): Date {
  return new Date(sqliteTimestamp.replace(" ", "T") + "Z")
}

interface TableCount {
  inserted: number
  skippedDropped: number
  skippedConflict: number
}
function emptyCount(): TableCount {
  return { inserted: 0, skippedDropped: 0, skippedConflict: 0 }
}

// =======================================================================
// Source rows (SQLite), read-only
// =======================================================================
interface SqliteUserRow {
  pseudo: string
  password_hash: string
  avatar_seed: string
  bio: string
  created_at: string
  last_seen: string
  banned: number
  custom_avatar_filename: string | null
  custom_avatar_status: string | null
}
interface SqliteQuestionRow {
  id: number
  pseudo: string
  theme: string
  content: string
  ts: string
  answered: number
  flagged: number
}
interface SqliteReactionRow {
  question_id: number
}
interface SqliteBadgeUnlockRow {
  pseudo: string
  badge_id: string
  unlocked_at: string
}
interface SqliteLiveSessionRow {
  id: number
  theme_id: string
  state: string
  current_q_idx: number
  question_started_at: string | null
  question_duration_s: number
  created_at: string
  updated_at: string
  question_order: string | null
}
interface SqliteLiveParticipantRow {
  session_id: number
  pseudo: string
  score: number
  joined_at: string
}
interface SqliteLiveAnswerRow {
  session_id: number
  pseudo: string
  q_id: string
  choice: number
  is_correct: number
  score: number
  elapsed_ms: number
  ts: string
}
interface SqliteVoteRow {
  pseudo: string
  topic_id: string
  ts: string
}
interface SqliteAppStateRow {
  key: string
  value: string
}

function readSource(path: string) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    const users = db.prepare("SELECT * FROM users").all() as unknown as SqliteUserRow[]
    const questions = db.prepare("SELECT * FROM questions").all() as unknown as SqliteQuestionRow[]
    const reactions = db
      .prepare("SELECT question_id FROM question_reactions")
      .all() as unknown as SqliteReactionRow[]
    const badgeUnlocks = db
      .prepare("SELECT pseudo, badge_id, unlocked_at FROM badge_unlocks")
      .all() as unknown as SqliteBadgeUnlockRow[]
    const liveSessions = db
      .prepare("SELECT * FROM live_sessions")
      .all() as unknown as SqliteLiveSessionRow[]
    const liveParticipants = db
      .prepare("SELECT session_id, pseudo, score, joined_at FROM live_participants")
      .all() as unknown as SqliteLiveParticipantRow[]
    const liveAnswers = db
      .prepare("SELECT session_id, pseudo, q_id, choice, is_correct, score, elapsed_ms, ts FROM live_answers")
      .all() as unknown as SqliteLiveAnswerRow[]
    const votes = db.prepare("SELECT pseudo, topic_id, ts FROM votes").all() as unknown as SqliteVoteRow[]
    const appState = db.prepare("SELECT key, value FROM app_state").all() as unknown as SqliteAppStateRow[]
    const eventsCount = (db.prepare("SELECT COUNT(*) AS n FROM events").get() as { n: number }).n

    return {
      users,
      questions,
      reactions,
      badgeUnlocks,
      liveSessions,
      liveParticipants,
      liveAnswers,
      votes,
      appState,
      eventsCount,
    }
  } finally {
    db.close()
  }
}

// =======================================================================
// Migration steps. All take the open transactional client and return
// per-table counts. Order matters — foreign keys.
// =======================================================================

/** Step 1: the eight orphan badges, then a full slug→id lookup covering
 * both those and the ten pre-existing slugs BADGE_MAP also targets. */
async function migrateBadges(client: pg.Client) {
  const count = emptyCount()
  for (let i = 0; i < ORPHAN_BADGES.length; i++) {
    const b = ORPHAN_BADGES[i]
    const res = await client.query(
      `INSERT INTO badges (slug, name, description, icon, points, kind, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING`,
      [b.slug, b.name, b.description, b.icon, b.points, b.kind, 100 + i],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }

  // BADGE_MAP's full value set: the 8 orphans (self-mapped) plus the 9
  // distinct pre-existing slugs the other 10 old ids map onto (`asker` is
  // targeted twice, by "bavard" and "causeur").
  const targetSlugs = [...new Set(Object.values(BADGE_MAP))]
  const { rows } = await client.query<{ slug: string; id: string }>(
    `SELECT slug, id FROM badges WHERE slug = ANY($1::text[])`,
    [targetSlugs],
  )
  const badgeIdBySlug = new Map(rows.map((r) => [r.slug, r.id]))
  for (const slug of targetSlugs) {
    if (!badgeIdBySlug.has(slug)) {
      throw new Error(`[migrate] badge slug "${slug}" (target of BADGE_MAP) does not exist in destination`)
    }
  }
  return { count, badgeIdBySlug }
}

/** Step 2: users, after resolveCollisions. Sentinel passphrase, points=0,
 * bio dropped, banned→status, last_seen→last_seen_at. */
async function migrateUsers(client: pg.Client, sourceUsers: SqliteUserRow[]) {
  const count = emptyCount()
  const migrationUsers: MigrationUser[] = sourceUsers.map((u) => ({
    pseudo: u.pseudo,
    createdAt: parseUtc(u.created_at),
  }))
  const { keep, drop } = resolveCollisions(migrationUsers)
  const keepSet = new Set(keep)
  count.skippedDropped = drop.length

  const userIdByPseudo = new Map<string, string>()
  const byPseudo = new Map(sourceUsers.map((u) => [u.pseudo, u]))

  for (const pseudo of keep) {
    const u = byPseudo.get(pseudo)!
    const pseudoLower = pseudo.toLowerCase()
    const status = u.banned ? "suspended" : "active"
    const insertRes = await client.query<{ id: string }>(
      `INSERT INTO users (pseudo, pseudo_lower, passphrase_hash, avatar_seed, status, points, created_at, last_seen_at)
       VALUES ($1,$2,'reset-required',$3,$4,0,$5,$6)
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [pseudo, pseudoLower, u.avatar_seed, status, parseUtc(u.created_at), parseUtc(u.last_seen)],
    )
    if (insertRes.rows[0]) {
      userIdByPseudo.set(pseudo, insertRes.rows[0].id)
      count.inserted++
    } else {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM users WHERE pseudo_lower = $1`,
        [pseudoLower],
      )
      if (existing.rows[0]) userIdByPseudo.set(pseudo, existing.rows[0].id)
      count.skippedConflict++
    }
  }
  void keepSet
  return { count, userIdByPseudo, droppedPseudos: drop }
}

/** Step 3: user_badges (source table: badge_unlocks), via BADGE_MAP. Rows
 * belonging to the dropped account are skipped, not errored. */
async function migrateUserBadges(
  client: pg.Client,
  rows: SqliteBadgeUnlockRow[],
  userIdByPseudo: Map<string, string>,
  badgeIdBySlug: Map<string, string>,
) {
  const count = emptyCount()
  for (const r of rows) {
    const userId = userIdByPseudo.get(r.pseudo)
    if (!userId) {
      count.skippedDropped++
      continue
    }
    const slug = BADGE_MAP[r.badge_id]
    if (!slug) {
      // BADGE_MAP is documented as total over the old id set. If this ever
      // fires, the map is missing an entry — that is a bug to fix, not a
      // row to silently drop.
      throw new Error(`[migrate] no BADGE_MAP entry for old badge id "${r.badge_id}"`)
    }
    const badgeId = badgeIdBySlug.get(slug)!
    const res = await client.query(
      `INSERT INTO user_badges (user_id, badge_id, awarded_at)
       VALUES ($1,$2,$3)
       ON CONFLICT DO NOTHING`,
      [userId, badgeId, parseUtc(r.unlocked_at)],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return count
}

/** Step 4+5: questions (content→body, answered→status) with
 * question_reactions summed into upvotes at insert time — same end state as
 * insert-then-UPDATE, one fewer round trip per row. */
async function migrateQuestions(
  client: pg.Client,
  rows: SqliteQuestionRow[],
  reactions: SqliteReactionRow[],
  userIdByPseudo: Map<string, string>,
) {
  const count = emptyCount()
  const upvotesByQuestionId = new Map<number, number>()
  for (const r of reactions) {
    upvotesByQuestionId.set(r.question_id, (upvotesByQuestionId.get(r.question_id) ?? 0) + 1)
  }

  const questionIdByOldId = new Map<number, string>()
  for (const r of rows) {
    const userId = userIdByPseudo.get(r.pseudo)
    if (!userId) {
      count.skippedDropped++
      continue
    }
    const id = uuidv5(`question:${r.id}`)
    questionIdByOldId.set(r.id, id)
    // The new schema comment says pending|answered|hidden; the app's own
    // code (app/actions/engage.ts, app/actions/admin.ts) only ever reads
    // or writes pending|approved|rejected — the wall's query is literally
    // `WHERE status = 'approved'`. An old `answered` question was reviewed
    // and (per Discord) actually answered, so it is the "approved,
    // visible" side of that real enum; an unanswered one is still
    // "pending" review, exactly the state a fresh submission starts in.
    const status = r.answered ? "approved" : "pending"
    const upvotes = upvotesByQuestionId.get(r.id) ?? 0
    const res = await client.query(
      `INSERT INTO questions (id, user_id, pseudo, body, status, upvotes, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT DO NOTHING`,
      [id, userId, r.pseudo, r.content, status, upvotes, parseUtc(r.ts)],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return { count, questionIdByOldId }
}

/** Step 6: live_sessions. theme_id→quiz_slug, straight passthrough — see
 * the file header on why deterministic ids matter here specifically. */
async function migrateLiveSessions(client: pg.Client, rows: SqliteLiveSessionRow[]) {
  const count = emptyCount()
  const sessionIdByOldId = new Map<number, string>()
  for (const r of rows) {
    const id = uuidv5(`live_session:${r.id}`)
    sessionIdByOldId.set(r.id, id)
    const res = await client.query(
      `INSERT INTO live_sessions
         (id, quiz_slug, state, current_q_idx, question_order, question_started_at, question_duration_s, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT DO NOTHING`,
      [
        id,
        r.theme_id,
        r.state,
        r.current_q_idx,
        r.question_order ?? "[]",
        r.question_started_at ? parseUtc(r.question_started_at) : null,
        r.question_duration_s,
        parseUtc(r.created_at),
        parseUtc(r.updated_at),
      ],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return { count, sessionIdByOldId }
}

/** Step 7: live_participants. pseudo→user_id, session_id remapped. */
async function migrateLiveParticipants(
  client: pg.Client,
  rows: SqliteLiveParticipantRow[],
  sessionIdByOldId: Map<number, string>,
  userIdByPseudo: Map<string, string>,
) {
  const count = emptyCount()
  for (const r of rows) {
    const userId = userIdByPseudo.get(r.pseudo)
    if (!userId) {
      count.skippedDropped++
      continue
    }
    const sessionId = sessionIdByOldId.get(r.session_id)
    if (!sessionId) throw new Error(`[migrate] live_participants references unknown session ${r.session_id}`)
    const res = await client.query(
      `INSERT INTO live_participants (session_id, user_id, score, joined_at)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT DO NOTHING`,
      [sessionId, userId, r.score, parseUtc(r.joined_at)],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return count
}

/** Step 8: live_answers. pseudo→user_id, q_id→question_key (bare
 * passthrough — see app/api/live/stream/route.ts's question_key contract
 * in the vault notes / this file's header for why that's the right call). */
async function migrateLiveAnswers(
  client: pg.Client,
  rows: SqliteLiveAnswerRow[],
  sessionIdByOldId: Map<number, string>,
  userIdByPseudo: Map<string, string>,
) {
  const count = emptyCount()
  for (const r of rows) {
    const userId = userIdByPseudo.get(r.pseudo)
    if (!userId) {
      count.skippedDropped++
      continue
    }
    const sessionId = sessionIdByOldId.get(r.session_id)
    if (!sessionId) throw new Error(`[migrate] live_answers references unknown session ${r.session_id}`)
    const res = await client.query(
      `INSERT INTO live_answers (session_id, user_id, question_key, choice, is_correct, score, elapsed_ms, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING`,
      [sessionId, userId, r.q_id, r.choice, Boolean(r.is_correct), r.score, r.elapsed_ms, parseUtc(r.ts)],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return count
}

/** votes: 0 rows in the current source, but implemented generally — same
 * principle as resolveCollisions() not special-casing today's one pair. */
async function migrateVotes(client: pg.Client, rows: SqliteVoteRow[], userIdByPseudo: Map<string, string>) {
  const count = emptyCount()
  for (const r of rows) {
    const userId = userIdByPseudo.get(r.pseudo)
    if (!userId) {
      count.skippedDropped++
      continue
    }
    const res = await client.query(
      `INSERT INTO votes (user_id, topic_key, created_at) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
      [userId, r.topic_id, parseUtc(r.ts)],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return count
}

/** Step 9: settings, from app_state. Only vote_open/ai_open have a new-app
 * home; discord_persona/discord_thread_mode are old-app-specific and drop. */
async function migrateSettings(client: pg.Client, rows: SqliteAppStateRow[]) {
  const count = emptyCount()
  const WANTED = new Set(["vote_open", "ai_open"])
  for (const r of rows) {
    if (!WANTED.has(r.key)) {
      count.skippedDropped++
      continue
    }
    const parsed = JSON.parse(r.value) as { open?: boolean }
    const res = await client.query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,now()) ON CONFLICT (key) DO NOTHING`,
      [r.key, JSON.stringify(Boolean(parsed.open))],
    )
    if (res.rowCount) count.inserted++
    else count.skippedConflict++
  }
  return count
}

// =======================================================================
// Main
// =======================================================================
async function main() {
  console.log(`[migrate] source: ${sourcePath}`)
  console.log(`[migrate] mode: ${commit ? "COMMIT (writing)" : "DRY RUN (no changes will be written)"}`)

  const source = readSource(sourcePath)
  console.log(
    `[migrate] read from source: users=${source.users.length} questions=${source.questions.length} ` +
      `question_reactions=${source.reactions.length} badge_unlocks=${source.badgeUnlocks.length} ` +
      `live_sessions=${source.liveSessions.length} live_participants=${source.liveParticipants.length} ` +
      `live_answers=${source.liveAnswers.length} votes=${source.votes.length} app_state=${source.appState.length} ` +
      `events=${source.eventsCount}`,
  )

  const connectionString =
    process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED
  if (!connectionString) {
    console.error("[migrate] DATABASE_URL is not set.")
    process.exit(1)
  }
  const useSsl = /sslmode=require/.test(connectionString) || /neon\.tech/.test(connectionString)
  const client = new pg.Client({
    connectionString,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  })

  await client.connect()
  let mismatched = false
  try {
    await client.query("BEGIN")

    const { count: badgesCount, badgeIdBySlug } = await migrateBadges(client)
    const { count: usersCount, userIdByPseudo, droppedPseudos } = await migrateUsers(client, source.users)
    const userBadgesCount = await migrateUserBadges(client, source.badgeUnlocks, userIdByPseudo, badgeIdBySlug)
    const { count: questionsCount } = await migrateQuestions(
      client,
      source.questions,
      source.reactions,
      userIdByPseudo,
    )
    const { count: liveSessionsCount, sessionIdByOldId } = await migrateLiveSessions(client, source.liveSessions)
    const liveParticipantsCount = await migrateLiveParticipants(
      client,
      source.liveParticipants,
      sessionIdByOldId,
      userIdByPseudo,
    )
    const liveAnswersCount = await migrateLiveAnswers(client, source.liveAnswers, sessionIdByOldId, userIdByPseudo)
    const votesCount = await migrateVotes(client, source.votes, userIdByPseudo)
    const settingsCount = await migrateSettings(client, source.appState)

    console.log("\n[migrate] per-table results (this run):")
    const report: Array<[string, TableCount]> = [
      ["badges (orphans)", badgesCount],
      ["users", usersCount],
      ["user_badges (badge_unlocks)", userBadgesCount],
      ["questions", questionsCount],
      ["live_sessions", liveSessionsCount],
      ["live_participants", liveParticipantsCount],
      ["live_answers", liveAnswersCount],
      ["votes", votesCount],
      ["settings (app_state)", settingsCount],
    ]
    for (const [name, c] of report) {
      console.log(
        `  ${name.padEnd(28)} inserted=${c.inserted}  skipped_dropped=${c.skippedDropped}  skipped_conflict=${c.skippedConflict}`,
      )
    }
    if (droppedPseudos.length) {
      console.log(`  users dropped (collision losers): ${droppedPseudos.join(", ")}`)
    }
    console.log(`  events: 0 migrated — no destination table (${source.eventsCount} rows remain source-only)`)

    console.log("\n[migrate] numbers check (source table → migrated count) vs. the expected table:")
    const actual = {
      users: { source: source.users.length, migrates: usersCount.inserted + usersCount.skippedConflict },
      badge_unlocks: {
        source: source.badgeUnlocks.length,
        migrates: userBadgesCount.inserted + userBadgesCount.skippedConflict,
      },
      live_answers: {
        source: source.liveAnswers.length,
        migrates: liveAnswersCount.inserted + liveAnswersCount.skippedConflict,
      },
      live_participants: {
        source: source.liveParticipants.length,
        migrates: liveParticipantsCount.inserted + liveParticipantsCount.skippedConflict,
      },
      live_sessions: {
        source: source.liveSessions.length,
        migrates: liveSessionsCount.inserted + liveSessionsCount.skippedConflict,
      },
      questions: { source: source.questions.length, migrates: questionsCount.inserted + questionsCount.skippedConflict },
      votes: { source: source.votes.length, migrates: votesCount.inserted + votesCount.skippedConflict },
      app_state: { source: source.appState.length, migrates: settingsCount.inserted + settingsCount.skippedConflict },
      events: { source: source.eventsCount, migrates: 0 },
    }

    for (const key of Object.keys(EXPECTED) as Array<keyof typeof EXPECTED>) {
      const exp = EXPECTED[key]
      const act = actual[key]
      const ok = exp.source === act.source && exp.migrates === act.migrates
      if (!ok) mismatched = true
      console.log(
        `  ${key.padEnd(20)} expected source=${exp.source} migrates=${exp.migrates}  |  actual source=${act.source} migrates=${act.migrates}  ${ok ? "OK" : "MISMATCH"}`,
      )
    }

    if (mismatched) {
      console.error(
        "\n[migrate] MISMATCH against the expected numbers table — stopping. Rolling back regardless of --commit.",
      )
      await client.query("ROLLBACK")
    } else if (commit) {
      await client.query("COMMIT")
      console.log("\n[migrate] COMMIT: changes written.")
    } else {
      await client.query("ROLLBACK")
      console.log("\n[migrate] DRY RUN: rolled back, nothing written. Pass --commit to write for real.")
    }
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("[migrate] failed, rolled back:", err)
    process.exitCode = 1
    throw err
  } finally {
    await client.end()
  }

  if (mismatched) process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
