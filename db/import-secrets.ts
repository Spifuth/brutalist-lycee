// Loads a private secrets file (YAML) into the database.
//
//   pnpm secrets:import -- --file db/secrets.yml
//   pnpm secrets:import -- --file db/secrets.yml --dry-run
//   docker exec -i brutalist-web tsx db/import-secrets.ts --stdin < db/secrets.yml
//
// The last form is the production one: the database is reachable only from
// the Docker network, and the file — gitignored — is not in the image. So it
// is pushed through standard input, without ever copying it in.
//
// Idempotent: every secret is an upsert on its code, every alias is
// rewritten identically. Nothing is ever deleted, except the aliases of a
// secret that gets re-imported without them.
import pg from "pg"
import { readFileSync } from "node:fs"
import { parseSecretsYaml, type SecretEntry } from "../lib/secrets-yaml.ts"
import { FINAL_MILESTONE_CODE } from "../lib/milestones.ts"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const fileIndex = args.indexOf("--file")
const useStdin = args.includes("--stdin")
// Only for re-importing an export made before the "name doesn't give away the answer" rule.
const lenient = args.includes("--lenient")

if (!useStdin && fileIndex === -1) {
  console.error("[import] usage : --file <chemin> | --stdin  [--dry-run] [--lenient]")
  process.exit(1)
}

const connectionString =
  process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL_UNPOOLED
if (!connectionString && !dryRun) {
  console.error("[import] DATABASE_URL n'est pas défini.")
  process.exit(1)
}

const source = useStdin ? readFileSync(0, "utf8") : readFileSync(args[fileIndex + 1], "utf8")

let entries: SecretEntry[]
try {
  entries = parseSecretsYaml(source, { lenientNames: lenient })
} catch (err) {
  // The file is hand-edited between classes: an error must say what to fix
  // and where, not just that something is wrong.
  console.error(`[import] fichier refusé — ${(err as Error).message}`)
  process.exit(1)
}

console.log(`[import] ${entries.length} secrets lus, ${entries.reduce((n, e) => n + e.aliases.length, 0)} alias.`)
if (dryRun) {
  for (const e of entries) {
    console.log(`  ${e.code.padEnd(24)} ${e.difficulty.padEnd(7)} ${String(e.points).padStart(3)} pts  ${e.category}`)
  }
  console.log("[import] --dry-run : rien n'a été écrit.")
  process.exit(0)
}

const db = new pg.Client({ connectionString })

async function main() {
  await db.connect()
  let created = 0
  let updated = 0
  let aliasCount = 0

  for (const e of entries) {
    const { rows } = await db.query<{ id: string; inserted: boolean }>(
      `INSERT INTO secrets (code, name, hint, location, points, category, difficulty, badge_slug, active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
       ON CONFLICT (code) DO UPDATE SET
         name=EXCLUDED.name, hint=EXCLUDED.hint, location=EXCLUDED.location,
         points=EXCLUDED.points, category=EXCLUDED.category,
         difficulty=EXCLUDED.difficulty, badge_slug=EXCLUDED.badge_slug
       RETURNING id, (xmax = 0) AS inserted`,
      [e.code, e.name, e.hint, e.location, e.points, e.category, e.difficulty, e.badgeSlug ?? null],
    )
    const { id, inserted } = rows[0]
    inserted ? created++ : updated++

    await db.query("DELETE FROM secret_aliases WHERE secret_id = $1", [id])
    for (const alias of e.aliases) {
      await db.query(
        `INSERT INTO secret_aliases (code, secret_id) VALUES ($1,$2)
         ON CONFLICT (code) DO UPDATE SET secret_id = EXCLUDED.secret_id`,
        [alias, id],
      )
      aliasCount++
    }
  }

  // The final milestone means "all the ordinary secrets", and that count just
  // changed. Leaving it at its hardcoded value is exactly what made the final
  // reward fire seven secrets too early in production.
  const { rows: milestone } = await db.query<{ unlock_at: number }>(
    `UPDATE secrets
        SET unlock_at = (SELECT COUNT(*) FROM secrets WHERE active AND unlock_at IS NULL)
      WHERE code = $1
      RETURNING unlock_at`,
    [FINAL_MILESTONE_CODE],
  )

  console.log(`[import] ${created} créés, ${updated} mis à jour, ${aliasCount} alias.`)
  if (milestone[0]) {
    console.log(`[import] palier final « ${FINAL_MILESTONE_CODE} » recalé sur ${milestone[0].unlock_at} secrets ordinaires.`)
  } else {
    console.log(`[import] pas de palier final en base — rien à recaler.`)
  }
}

main()
  .catch((err) => {
    console.error("[import] échec :", err)
    process.exit(1)
  })
  .finally(() => db.end())
