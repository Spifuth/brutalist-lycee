// Verse un fichier de secrets privé (YAML) dans la base.
//
//   pnpm secrets:import -- --file db/secrets.yml
//   pnpm secrets:import -- --file db/secrets.yml --dry-run
//   docker exec -i brutalist-web tsx db/import-secrets.ts --stdin < db/secrets.yml
//
// La dernière forme est celle de la prod : la base n'est joignable que depuis
// le réseau Docker, et le fichier — gitignoré — n'est pas dans l'image. On le
// pousse donc par l'entrée standard, sans jamais l'y copier.
//
// Idempotent : chaque secret est un upsert sur son code, chaque alias est
// réécrit à l'identique. Rien n'est jamais supprimé, sauf les alias d'un
// secret qu'on réimporte sans eux.
import pg from "pg"
import { readFileSync } from "node:fs"
import { parseSecretsYaml, type SecretEntry } from "../lib/secrets-yaml.ts"
import { FINAL_MILESTONE_CODE } from "../lib/milestones.ts"

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
const fileIndex = args.indexOf("--file")
const useStdin = args.includes("--stdin")
// Uniquement pour réimporter un export d'avant la règle « le nom ne dit pas la réponse ».
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
  // Le fichier est écrit à la main entre deux cours : l'erreur doit dire quoi
  // corriger et où, pas seulement qu'il y a une erreur.
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

  // Le palier final vaut « tous les secrets ordinaires », et ce nombre vient de
  // changer. Le laisser à sa valeur écrite en dur est exactement ce qui a fait
  // tomber la récompense finale sept secrets trop tôt en prod.
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
